import { Controller, Get, NotFoundException, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators.js';
import { allowVerifyAttempt } from '../common/guards.js';
import { serializeCertificate, serializeCourse, serializeSettings, serializeStudent } from '../common/serialize.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('public')
@Public()
export class PublicController {
  constructor(private prisma: PrismaService) {}

  @Get('meta')
  async meta() {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'default' } });
    return { settings: settings ? serializeSettings(settings) : null };
  }

  @Get('stats')
  async stats() {
    const [students, certificates, courses] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.certificate.count(),
      this.prisma.course.count({ where: { status: 'active' } }),
    ]);
    return { students, certificates, courses };
  }

  @Get('verify/:certificateNumber/photo')
  async photo(@Param('certificateNumber') certificateNumber: string, @Res() res: Response) {
    const cert = await this.find(certificateNumber);
    if (!cert?.student.photoData) throw new NotFoundException();
    res.setHeader('Content-Type', cert.student.photoMimeType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(cert.student.photoData));
  }

  @Get('verify/:certificateNumber')
  async verify(@Param('certificateNumber') certificateNumber: string, @Req() req: Request) {
    const ip = req.ip ?? 'unknown';
    if (!allowVerifyAttempt(ip)) {
      return {
        state: 'rate_limited',
        message: 'Too many verification attempts. Please wait a moment and try again.',
      };
    }
    const settings = await this.prisma.settings.findUnique({ where: { id: 'default' } });
    const cert = await this.find(certificateNumber);
    if (!cert) return { state: 'not_found' };
    const payload = {
      certificate: serializeCertificate(cert),
      student: {
        ...serializeStudent(cert.student),
        photoDataUrl: `/api/public/verify/${encodeURIComponent(cert.certificateNumber)}/photo`,
      },
      course: serializeCourse(cert.course),
      settings: settings ? serializeSettings(settings) : null,
    };
    if (cert.status === 'valid') return { state: 'valid', ...payload };
    if (cert.status === 'revoked') return { state: 'revoked', ...payload };
    return { state: 'unavailable', ...payload };
  }

  private find(number: string) {
    return this.prisma.certificate.findFirst({
      where: { certificateNumberKey: decodeURIComponent(number).trim().toLowerCase() },
      include: { student: true, course: true },
    });
  }

}
