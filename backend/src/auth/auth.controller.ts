import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../common/decorators.js';
import { clientIp, serializeUser } from '../common/serialize.js';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto, UpdateProfileDto } from './dto.js';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.login(body.email, body.password, clientIp(req), res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.auth.logout(res);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return { user: serializeUser(user) };
  }

  @Patch('profile')
  updateProfilePatch(
    @Body() body: UpdateProfileDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.saveProfile(body, user, req);
  }

  @Post('profile')
  @HttpCode(200)
  updateProfilePost(
    @Body() body: UpdateProfileDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.saveProfile(body, user, req);
  }

  @Patch('password')
  changePasswordPatch(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.savePassword(body, user, req);
  }

  @Post('password')
  @HttpCode(200)
  changePasswordPost(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.savePassword(body, user, req);
  }

  @Public()
  @Post('forgot-password')
  forgot(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  reset(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.email, body.otp, body.password);
  }

  private async saveProfile(body: UpdateProfileDto, user: User, req: Request) {
    if (!user?.id) throw new UnauthorizedException('Please sign in again.');
    const updated = await this.auth.updateProfile(user.id, body.name, body.email, clientIp(req));
    return { user: updated };
  }

  private savePassword(body: ChangePasswordDto, user: User, req: Request) {
    if (!user?.id) throw new UnauthorizedException('Please sign in again.');
    return this.auth.changePassword(user.id, body.currentPassword, body.newPassword, clientIp(req));
  }
}
