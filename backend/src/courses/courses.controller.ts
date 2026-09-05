import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';
import type { CourseStatus, User } from '@prisma/client';
import { CurrentUser } from '../common/decorators.js';
import { LogsService } from '../common/logs.service.js';
import { clientIp, serializeCourse } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';

class CourseDto {
  @IsString()
  name: string;
  @IsString()
  code: string;
  @IsString()
  department: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

@Controller('courses')
export class CoursesController {
  constructor(
    private prisma: PrismaService,
    private logs: LogsService,
  ) {}

  @Get()
  async list() {
    const courses = await this.prisma.course.findMany({ orderBy: { name: 'asc' } });
    return { courses: courses.map(serializeCourse) };
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found.');
    return { course: serializeCourse(course) };
  }

  @Post()
  async create(@Body() body: CourseDto, @CurrentUser() actor: User, @Req() req: Request) {
    const code = body.code.trim().toUpperCase();
    const exists = await this.prisma.course.findUnique({ where: { code } });
    if (exists) throw new ConflictException('A course with this code already exists.');
    const course = await this.prisma.course.create({
      data: {
        name: body.name.trim(),
        code,
        department: body.department.trim(),
        description: body.description ?? '',
        status: (body.status ?? 'active') as CourseStatus,
      },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Course created',
      recordType: 'course',
      recordId: course.id,
      ipAddress: clientIp(req),
    });
    return { course: serializeCourse(course) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CourseDto>,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    if (body.code) {
      const code = body.code.trim().toUpperCase();
      const exists = await this.prisma.course.findFirst({
        where: { code, NOT: { id } },
      });
      if (exists) throw new ConflictException('A course with this code already exists.');
      body.code = code;
    }
    const course = await this.prisma.course.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        code: body.code,
        department: body.department?.trim(),
        description: body.description,
        status: body.status as CourseStatus | undefined,
      },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Course updated',
      recordType: 'course',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { course: serializeCourse(course) };
  }
}
