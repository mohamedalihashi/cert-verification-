import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async record(input: {
    userId: string;
    userName: string;
    action: string;
    recordType: string;
    recordId: string;
    ipAddress: string;
  }) {
    return this.prisma.activityLog.create({ data: input });
  }
}
