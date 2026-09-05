import { extname, join } from 'node:path';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PHOTO_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const CERT_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
const CERT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class FilesService {
  constructor(private config: ConfigService) {}

  root() {
    return this.config.get<string>('UPLOAD_DIR') ?? './uploads';
  }

  validate(file: Express.Multer.File, kind: 'photo' | 'certificate', maxMb: number) {
    if (!file) throw new BadRequestException('File is required.');
    const ext = extname(file.originalname).toLowerCase();
    const allowedExts = kind === 'photo' ? PHOTO_EXTS : CERT_EXTS;
    const allowedMimes = kind === 'photo' ? PHOTO_MIMES : CERT_MIMES;
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(`Unsupported file type. Allowed: ${allowedExts.join(', ')}`);
    }
    if (file.mimetype && !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File MIME type is not allowed.');
    }
    if (file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`File is too large. Maximum size is ${maxMb} MB.`);
    }
  }

  async save(kind: 'photo' | 'certificate', id: string, file: Express.Multer.File) {
    const dir = join(this.root(), kind === 'photo' ? 'photos' : 'certificates');
    await mkdir(dir, { recursive: true });
    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${id}${ext}`;
    const path = join(dir, filename);
    await writeFile(path, file.buffer);
    return path;
  }

  async read(path: string | null | undefined) {
    if (!path || !existsSync(path)) return null;
    return readFile(path);
  }

  async remove(path: string | null | undefined) {
    if (!path || !existsSync(path)) return;
    await unlink(path);
  }
}
