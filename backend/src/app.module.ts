import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { CertificatesModule } from './certificates/certificates.module.js';
import { CommonModule } from './common/common.module.js';
import { JwtAuthGuard, RolesGuard } from './common/guards.js';
import { CoursesModule } from './courses/courses.module.js';
import { ExtraModule } from './admin/extra.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StudentsModule } from './students/students.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    StudentsModule,
    CertificatesModule,
    ExtraModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
