import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, ROLES_KEY } from './decorators.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest().user as { role?: string };
    if (!user) throw new UnauthorizedException();
    if (!roles.includes(user.role ?? '')) {
      throw new ForbiddenException('This action requires a Super Administrator.');
    }
    return true;
  }
}

const verifyHits = new Map<string, number[]>();

export function allowVerifyAttempt(ip: string, max = 8, windowMs = 60_000) {
  const now = Date.now();
  const stamps = (verifyHits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (stamps.length >= max) return false;
  stamps.push(now);
  verifyHits.set(ip, stamps);
  return true;
}
