import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { Request } from 'express';
import type { User, UserStatus } from '@prisma/client';
import { CurrentUser, Roles } from '../common/decorators.js';
import { LogsService } from '../common/logs.service.js';
import { clientIp, serializeUser } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import * as bcrypt from 'bcrypt';

class CreateUserDto {
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsIn(['super_admin', 'staff'])
  role: string;
  @IsString()
  @MinLength(8)
  password: string;
}

class StatusDto {
  @IsIn(['active', 'disabled'])
  status: string;
}

class PasswordDto {
  @IsString()
  @MinLength(8)
  password: string;
}

@Controller('users')
@Roles('super_admin')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private logs: LogsService,
  ) {}

  @Get()
  async list() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return { users: users.map(serializeUser) };
  }

  @Post()
  create(@Body() body: CreateUserDto, @CurrentUser() actor: User, @Req() req: Request) {
    return this.auth.createUser({
      ...body,
      actorId: actor.id,
      actorName: actor.name,
      ip: clientIp(req),
    }).then((user) => ({ user }));
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: StatusDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot change your own account status.');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: body.status as UserStatus },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: body.status === 'disabled' ? 'Administrator disabled' : 'Administrator enabled',
      recordType: 'user',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { user: serializeUser(user) };
  }

  @Patch(':id/password')
  async setPassword(
    @Param('id') id: string,
    @Body() body: PasswordDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Administrator password reset',
      recordType: 'user',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { ok: true };
  }
}
