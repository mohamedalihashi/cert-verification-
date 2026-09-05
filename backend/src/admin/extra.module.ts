import { Module } from '@nestjs/common';
import { PublicController } from '../public/public.controller.js';
import { FilesController } from '../files/files.controller.js';
import { AdminExtraController } from './admin.controller.js';

@Module({
  controllers: [PublicController, FilesController, AdminExtraController],
})
export class ExtraModule {}
