import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from '../common/files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('files')
export class FilesController {
  constructor(
    private prisma: PrismaService,
    private files: FilesService,
  ) {}

  @Get('students/:id/photo')
  async studentPhoto(@Param('id') id: string, @Res() res: Response) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student?.photoPath) throw new NotFoundException();
    const buf = await this.files.read(student.photoPath);
    if (!buf) throw new NotFoundException();
    const path = student.photoPath;
    const type = path.endsWith('.png')
      ? 'image/png'
      : path.endsWith('.svg')
        ? 'image/svg+xml'
        : path.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(buf);
  }
}
