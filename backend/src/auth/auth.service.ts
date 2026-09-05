import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'node:crypto';
import type { Response } from 'express';
import { LogsService } from '../common/logs.service.js';
import { serializeUser } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';

const COOKIE = 'access_token';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private logs: LogsService,
  ) {}

  cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get('COOKIE_SECURE') === 'true',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  async login(email: string, password: string, ip: string, res: Response) {
    await this.prisma.ensureConfiguredAdmin();
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password.');
    if (user.status === 'disabled') {
      throw new UnauthorizedException('This administrator account is disabled.');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password.');
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    res.cookie(COOKIE, token, this.cookieOptions());
    await this.logs.record({
      userId: user.id,
      userName: user.name,
      action: 'Admin logged in',
      recordType: 'session',
      recordId: user.id,
      ipAddress: ip,
    });
    return { user: serializeUser(user) };
  }

  logout(res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return { ok: true };
    const recent = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
    });
    if (recent) return { ok: true };
    const otp = String(randomInt(100000, 1000000));
    const tokenHash = this.otpHash(normalizedEmail, otp);
    await this.prisma.passwordReset.deleteMany({ where: { userId: user.id, used: false } });
    const reset = await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    try {
      await this.sendOtp(normalizedEmail, user.name, otp);
    } catch (error) {
      await this.prisma.passwordReset.delete({ where: { id: reset.id } }).catch(() => undefined);
      if (this.config.get('NODE_ENV') !== 'production') {
        console.error('[password-reset] Email delivery failed:', error);
      }
      throw new ServiceUnavailableException('Password-reset email is not configured or could not be sent.');
    }
    return { ok: true };
  }

  async resetPassword(email: string, otp: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = this.otpHash(normalizedEmail, otp.trim());
    const row = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });
    if (!row || row.used || row.expiresAt < new Date()) {
      throw new UnauthorizedException('This verification code is invalid or has expired.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user || user.email.toLowerCase() !== normalizedEmail) {
      throw new UnauthorizedException('This verification code is invalid or has expired.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: row.id },
        data: { used: true },
      }),
    ]);
    return { ok: true };
  }

  private otpHash(email: string, otp: string) {
    return createHash('sha256').update(`${email}:${otp}`).digest('hex');
  }

  private async sendOtp(email: string, name: string, otp: string) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');
    if (!apiKey || !from) throw new Error('RESEND_API_KEY and EMAIL_FROM are required.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your password reset code',
        text: `Hello ${name}, your password reset code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Hello ${name},</p><p>Your password reset code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>It expires in 10 minutes.</p>`,
      }),
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
  }

  async createUser(input: {
    name: string;
    email: string;
    role: string;
    password: string;
    actorId: string;
    actorName: string;
    ip: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('An account with this email already exists.');
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        role: input.role as UserRole,
        passwordHash: await bcrypt.hash(input.password, 12),
      },
    });
    await this.logs.record({
      userId: input.actorId,
      userName: input.actorName,
      action: 'Administrator created',
      recordType: 'user',
      recordId: user.id,
      ipAddress: input.ip,
    });
    return serializeUser(user);
  }

  async updateProfile(userId: string, name: string, email: string, ip: string) {
    const nextEmail = email.trim().toLowerCase();
    const taken = await this.prisma.user.findFirst({
      where: { email: nextEmail, NOT: { id: userId } },
    });
    if (taken) throw new ConflictException('An account with this email already exists.');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: name.trim(), email: nextEmail },
    });
    try {
      await this.logs.record({
        userId: user.id,
        userName: user.name,
        action: 'Profile updated',
        recordType: 'user',
        recordId: user.id,
        ipAddress: ip,
      });
    } catch {
      /* logging must not block saving the profile */
    }
    return serializeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, ip: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Please sign in again.');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    try {
      await this.logs.record({
        userId: user.id,
        userName: user.name,
        action: 'Password changed',
        recordType: 'user',
        recordId: user.id,
        ipAddress: ip,
      });
    } catch {
      /* logging must not block changing the password */
    }
    return { ok: true };
  }
}
