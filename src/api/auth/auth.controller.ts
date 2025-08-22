import { AuthService } from '@/api/auth/auth.service';
import { UserResDto } from '@/api/users/dto/user.res.dto';
import { UserEntity } from '@/api/users/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { AllConfigType } from '@/config/config.type';
import { ErrorCode } from '@/constants/error-code.constant';
import { ApiAuth, ApiPublic } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CookieOptions, Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /**
   * Get cookie configuration based on environment and origin
   */
  private getCookieConfig(origin?: string): CookieOptions {
    const isProduction =
      this.configService.getOrThrow('app.nodeEnv', {
        infer: true,
      }) === 'production';

    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    // Check if origin is localhost
    const isLocalhost =
      origin?.includes('localhost') || origin?.includes('127.0.0.1');

    const isSameDomain =
      origin &&
      frontendUrl &&
      new URL(origin).hostname === new URL(frontendUrl).hostname;

    const config: CookieOptions = {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: false,
      sameSite: 'lax',
    };

    if (isLocalhost) {
      // Local development
      config.secure = false;
      config.sameSite = 'lax';
    } else if (isSameDomain) {
      // Same domain in production
      config.secure = isProduction;
      config.sameSite = 'lax';
    } else {
      // Cross-domain in production
      config.secure = true; // Required for sameSite: 'none'
      config.sameSite = 'none'; // Required for cross-domain
    }

    return config;
  }

  @ApiPublic()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @ApiPublic()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.getOrThrow('app.frontendUrl', {
      infer: true,
    });

    const response = req.user as {
      data: UserEntity;
      success: boolean;
    };

    if (!response.success) {
      res.redirect(`${frontendUrl}/login?error=${ErrorCode.E003}`);
    }

    if (response.data.isActive === false) {
      res.redirect(`${frontendUrl}/login?error=${ErrorCode.E004}`);
    }

    const origin = req.get('origin') || req.get('referer');
    const cookieConfig = this.getCookieConfig(origin);

    const accessToken = this.authService.generateJwt(response.data);

    res.cookie('accessToken', accessToken, cookieConfig);

    res.redirect(frontendUrl);
  }

  @Post('dev-token')
  @ApiPublic({
    summary: 'Sinh token cho dev (public, chỉ dùng cho phát triển)',
    description:
      'Trả về access token cho userId truyền vào, chỉ dùng cho môi trường dev.',
  })
  async generateDevToken(@Body('userId') userId: Uuid) {
    return this.authService.generateTokenForDev(userId);
  }

  @ApiPublic()
  @Delete('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const origin = req.get('origin');
    const cookieConfig = this.getCookieConfig(origin);

    // Clear cookies with same config they were set with
    res.clearCookie('accessToken', {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  }

  @ApiAuth({
    summary: 'Get current user',
    description: 'Returns the current authenticated user information.',
    type: UserResDto,
  })
  @Get('me')
  async getMe(@Req() req: Request) {
    return this.authService.getMe(req);
  }
}
