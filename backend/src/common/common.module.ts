import { Global, Module } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { LogsService } from './logs.service.js';

@Global()
@Module({
  providers: [FilesService, LogsService],
  exports: [FilesService, LogsService],
})
export class CommonModule {}
