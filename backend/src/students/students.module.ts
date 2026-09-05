import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller.js';

@Module({
  controllers: [StudentsController],
})
export class StudentsModule {}
