import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type { CertificateStatus, User } from '@prisma/client';
import { CurrentUser, Roles } from '../common/decorators.js';
import { LogsService } from '../common/logs.service.js';
import { clientIp, serializeCertificate } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';

class CertificateDto {
  @IsString()
  studentId: string;
  @IsString()
  certificateNumber: string;
  @IsString()
  courseId: string;
  @IsString()
  issueDate: string;
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  graduationYear: number;
  @IsOptional()
  @IsString()
  overallResult?: string;
  @IsOptional()
  @IsString()
  grades?: string;
  @IsOptional()
  @IsString()
  status?: string;
  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('certificates')
export class CertificatesController {
  constructor(
    private prisma: PrismaService,
    private logs: LogsService,
  ) {}

  private parseGrades(raw?: string) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async assertUniqueNumber(number: string, excludeId?: string) {
    const key = number.trim().toLowerCase();
    const existing = await this.prisma.certificate.findFirst({
      where: {
        certificateNumberKey: key,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) throw new ConflictException('Certificate number already exists.');
  }

  @Get()
  async list(
    @Query('query') query?: string,
    @Query('courseId') courseId?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('issueDate') issueDate?: string,
  ) {
    const q = query?.trim().toLowerCase() ?? '';
    const certificates = await this.prisma.certificate.findMany({
      include: { student: true, course: true },
      orderBy: { issueDate: 'desc' },
    });
    const filtered = certificates.filter((c) => {
      if (courseId && c.courseId !== courseId) return false;
      if (year && String(c.graduationYear) !== year) return false;
      if (status && c.status !== status) return false;
      if (issueDate && c.issueDate.toISOString().slice(0, 10) !== issueDate) return false;
      if (!q) return true;
      return (
        c.certificateNumber.toLowerCase().includes(q) ||
        c.student.fullName.toLowerCase().includes(q) ||
        c.course.name.toLowerCase().includes(q)
      );
    });
    return { certificates: filtered.map(serializeCertificate) };
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found.');
    return { certificate: serializeCertificate(cert) };
  }

  @Post()
  async create(
    @Body() body: CertificateDto,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const certificateNumber = body.certificateNumber.trim();
    if (!certificateNumber) throw new ConflictException('Certificate number is required.');
    await this.assertUniqueNumber(certificateNumber);
    const cert = await this.prisma.certificate.create({
      data: {
        studentId: body.studentId,
        certificateNumber,
        certificateNumberKey: certificateNumber.toLowerCase(),
        courseId: body.courseId,
        issueDate: new Date(body.issueDate),
        graduationYear: Number(body.graduationYear),
        overallResult: body.overallResult ?? '',
        grades: this.parseGrades(body.grades),
        status: (body.status ?? 'valid') as CertificateStatus,
        notes: body.notes ?? '',
        createdById: actor.id,
      },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Certificate created',
      recordType: 'certificate',
      recordId: cert.id,
      ipAddress: clientIp(req),
    });
    return { certificate: serializeCertificate(cert) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CertificateDto>,
    @CurrentUser() actor: User,
    @Req() req: Request,
  ) {
    const current = await this.prisma.certificate.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Certificate not found.');
    if (body.certificateNumber !== undefined) {
      await this.assertUniqueNumber(body.certificateNumber, id);
    }
    const data: Record<string, unknown> = {};
    if (body.studentId) data.studentId = body.studentId;
    if (body.certificateNumber) {
      data.certificateNumber = body.certificateNumber.trim();
      data.certificateNumberKey = body.certificateNumber.trim().toLowerCase();
    }
    if (body.courseId) data.courseId = body.courseId;
    if (body.issueDate) data.issueDate = new Date(body.issueDate);
    if (body.graduationYear) data.graduationYear = Number(body.graduationYear);
    if (body.overallResult !== undefined) data.overallResult = body.overallResult;
    if (body.grades !== undefined) data.grades = this.parseGrades(body.grades);
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    const cert = await this.prisma.certificate.update({ where: { id }, data });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Certificate edited',
      recordType: 'certificate',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { certificate: serializeCertificate(cert) };
  }

  @Post(':id/revoke')
  setRevoked(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    return this.setStatus(id, 'revoked', 'Certificate revoked', actor, req);
  }

  @Post(':id/restore')
  setRestored(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    return this.setStatus(id, 'valid', 'Certificate restored', actor, req);
  }

  @Post(':id/archive')
  @Roles('super_admin')
  setArchived(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    return this.setStatus(id, 'archived', 'Certificate archived', actor, req);
  }

  @Delete(':id')
  @Roles('super_admin')
  async remove(@Param('id') id: string, @CurrentUser() actor: User, @Req() req: Request) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found.');
    await this.prisma.certificate.delete({ where: { id } });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action: 'Certificate deleted',
      recordType: 'certificate',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { ok: true };
  }

  private async setStatus(
    id: string,
    status: string,
    action: string,
    actor: User,
    req: Request,
  ) {
    const cert = await this.prisma.certificate.update({
      where: { id },
      data: { status: status as CertificateStatus },
    });
    await this.logs.record({
      userId: actor.id,
      userName: actor.name,
      action,
      recordType: 'certificate',
      recordId: id,
      ipAddress: clientIp(req),
    });
    return { certificate: serializeCertificate(cert) };
  }
}
