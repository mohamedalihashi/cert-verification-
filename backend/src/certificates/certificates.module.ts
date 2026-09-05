import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller.js';

@Module({
  controllers: [CertificatesController],
})
export class CertificatesModule {}
