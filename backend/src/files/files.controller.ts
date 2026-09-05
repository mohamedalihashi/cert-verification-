import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Get('students/:id/photo')
  async studentPhoto(@Param('id') id: string, @Res() res: Response) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student?.photoData) throw new NotFoundException();
    res.setHeader('Content-Type', student.photoMimeType ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(Buffer.from(student.photoData));
  }
}
