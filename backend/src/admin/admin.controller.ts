import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../common/decorators.js';
import { LogsService } from '../common/logs.service.js';
import { clientIp, serializeCertificate, serializeCourse, serializeSettings, serializeStudent, serializeUser } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';

class SettingsDto {
  @IsOptional() @IsString() schoolName?: string;
  @IsOptional() @IsString() schoolShortName?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() publicBaseUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxCertFileMb?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxPhotoMb?: number;
}

@Controller()
export class AdminExtraController {
  constructor(
    private prisma: PrismaService,
    private logs: LogsService,
  ) {}

  @Public()
  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('dashboard')
  async dashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const [
      students,
      certificates,
      issuedThisMonth,
      issuedThisYear,
      valid,
      revoked,
      courses,
      activeCourses,
      recent,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.certificate.count(),
      this.prisma.certificate.count({ where: { issueDate: { gte: monthStart } } }),
      this.prisma.certificate.count({ where: { issueDate: { gte: yearStart } } }),
      this.prisma.certificate.count({ where: { status: 'valid' } }),
      this.prisma.certificate.count({ where: { status: 'revoked' } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: 'active' } }),
      this.prisma.certificate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { student: true, course: true },
      }),
    ]);
    return {
      stats: {
        students,
        certificates,
        issuedThisMonth,
        issuedThisYear,
        valid,
        revoked,
        courses,
        activeCourses,
      },
      recent: recent.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        studentName: c.student.fullName,
        courseName: c.course.name,
        issueDate: c.issueDate.toISOString().slice(0, 10),
        status: c.status,
      })),
    };
  }

  @Get('settings')
  @Roles('super_admin')
  async getSettings() {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'default' } });
    return { settings: settings ? serializeSettings(settings) : null };
  }

  @Patch('settings')
  @Roles('super_admin')
  async updateSettings(@Body() body: SettingsDto, @CurrentUser() actor: User, @Req() req: Request) {
    const settings = await this.prisma.settings.update({
      where: { id: 'default' },
      data: body,
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Settings updated',
      recordType: 'settings',
      recordId: 'system',
      ipAddress: clientIp(req),
    });
    return { settings: serializeSettings(settings) };
  }

  @Get('logs')
  @Roles('super_admin')
  async logsList(@Req() req: Request) {
    const q = String(req.query.query ?? '').toLowerCase();
    const type = String(req.query.type ?? '');
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 400,
    });
    const rows = logs.filter((l) => {
      if (type && l.recordType !== type) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.recordId.toLowerCase().includes(q)
      );
    });
    return {
      logs: rows.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.userName,
        action: l.action,
        recordType: l.recordType,
        recordId: l.recordId,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  @Get('bootstrap')
  async bootstrap(@CurrentUser() user: User) {
    const [students, courses, certificates, settings] = await Promise.all([
      this.prisma.student.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.course.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.certificate.findMany({ orderBy: { issueDate: 'desc' } }),
      this.prisma.settings.findUnique({ where: { id: 'default' } }),
    ]);
    const payload: {
      user: ReturnType<typeof serializeUser>;
      students: ReturnType<typeof serializeStudent>[];
      courses: ReturnType<typeof serializeCourse>[];
      certificates: ReturnType<typeof serializeCertificate>[];
      settings: ReturnType<typeof serializeSettings> | null;
      users: ReturnType<typeof serializeUser>[];
      logs: unknown[];
    } = {
      user: serializeUser(user),
      students: students.map(serializeStudent),
      courses: courses.map(serializeCourse),
      certificates: certificates.map(serializeCertificate),
      settings: settings ? serializeSettings(settings) : null,
      users: [],
      logs: [],
    };
    if (user.role === 'super_admin') {
      const [users, logs] = await Promise.all([
        this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
        this.prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 400 }),
      ]);
      payload.users = users.map(serializeUser);
      payload.logs = logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.userName,
        action: l.action,
        recordType: l.recordType,
        recordId: l.recordId,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      }));
    }
    return payload;
  }
}
