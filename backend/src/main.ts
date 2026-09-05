import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

function allowedOrigins() {
  return (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (
      req.path.startsWith('/api/public') ||
      req.path.startsWith('/api/auth/')
    ) {
      return next();
    }
    const candidates = [req.headers.origin, req.headers.referer].filter(
      (value): value is string => Boolean(value),
    );
    if (candidates.length === 0) return next();
    const ok = candidates.some((value) => allowedOrigins().some((o) => value.startsWith(o)));
    if (!ok) {
      res.status(403).json({ message: 'Invalid request origin.' });
      return;
    }
    next();
  });
  await app.listen(process.env.PORT ?? 4000);
  console.log(`API listening on http://localhost:${process.env.PORT ?? 4000}`);
}

await bootstrap();
