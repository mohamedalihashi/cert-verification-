import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';
import type { Gender, User } from '@prisma/client';
import { CurrentUser, Roles } from '../common/decorators.js';
import { FilesService } from '../common/files.service.js';
import { LogsService } from '../common/logs.service.js';
import { clientIp, serializeStudent } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';

class StudentDto {
  @IsString()
  studentId: string;
  @IsString()
  fullName: string;
  @IsIn(['male', 'female', 'other'])
  gender: string;
  @IsString()
  courseId: string;
  @IsOptional()
  @IsString()
  photoDataUrl?: string;
}

@Controller('students')
export class StudentsController {
  constructor(
    private prisma: PrismaService,
    private files: FilesService,
    private logs: LogsService,
  ) {}

  @Get()
  async list() {
    const students = await this.prisma.student.findMany({ orderBy: { createdAt: 'desc' } });
    return { students: students.map(serializeStudent) };
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found.');
    return { student: serializeStudent(student) };
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }))
  async create(
    @Body() body: StudentDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const studentId = body.studentId.trim();
    if (await this.prisma.student.findUnique({ where: { studentId } })) {
      throw new ConflictException('Student ID already exists.');
    }
    const settings = await this.prisma.settings.findUnique({ where: { id: 'default' } });
    let student = await this.prisma.student.create({
      data: {
        studentId,
        fullName: body.fullName.trim(),
        gender: body.gender as Gender,
        courseId: body.courseId,
      },
    });
    if (photo) {
      this.files.validate(photo, 'photo', settings?.maxPhotoMb ?? 5);
      const photoPath = await this.files.save('photo', student.id, photo);
      student = await this.prisma.student.update({
        where: { id: student.id },
        data: { photoPath },
      });
    }
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Student created',
      recordType: 'student',
      recordId: student.id,
      ipAddress: clientIp(req),
    });
    return { student: serializeStudent(student) };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() body: Partial<StudentDto>,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const current = await this.prisma.student.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Student not found.');
    if (body.studentId) {
      const taken = await this.prisma.student.findFirst({
        where: { studentId: body.studentId.trim(), NOT: { id } },
      });
      if (taken) throw new ConflictException('Student ID already exists.');
    }
    const settings = await this.prisma.settings.findUnique({ where: { id: 'default' } });
    let photoPath = current.photoPath;
    if (photo) {
      this.files.validate(photo, 'photo', settings?.maxPhotoMb ?? 5);
      await this.files.remove(current.photoPath);
      photoPath = await this.files.save('photo', id, photo);
    }
    const student = await this.prisma.student.update({
      where: { id },
      data: {
        studentId: body.studentId?.trim(),
        fullName: body.fullName?.trim(),
        gender: body.gender as Gender | undefined,
        courseId: body.courseId,
        photoPath,
      },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Student edited',
      recordType: 'student',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { student: serializeStudent(student) };
  }

  @Delete(':id')
  @Roles('super_admin')
  async remove(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const count = await this.prisma.certificate.count({ where: { studentId: id } });
    if (count > 0) {
      throw new BadRequestException(
        'This student has certificates and cannot be deleted. Archive the certificates first.',
      );
    }
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found.');
    await this.files.remove(student.photoPath);
    await this.prisma.student.delete({ where: { id } });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Student deleted',
      recordType: 'student',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { ok: true };
  }
}
