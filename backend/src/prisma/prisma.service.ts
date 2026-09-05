import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await this.ensureConfiguredAdmin();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Create the first administrator only from private deployment configuration. */
  async ensureConfiguredAdmin() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!email || !password) return;
    if (password.length < 12) {
      throw new Error('ADMIN_INITIAL_PASSWORD must contain at least 12 characters.');
    }
    const existing = await this.user.findUnique({ where: { email } });
    if (existing) return;
    await this.user.create({
      data: {
        name: process.env.ADMIN_NAME?.trim() || 'System Administrator',
        email,
        role: 'super_admin',
        status: 'active',
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  }
}
