import { UserResDto } from '@/api/users/dto/user.res.dto';
import { UserEntity } from '@/api/users/entities/user.entity';
import { UserService } from '@/api/users/user.service';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  generateJwt(user: UserEntity): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };
    const options: JwtSignOptions = {
      algorithm: 'RS256',
    };
    return this.jwtService.sign(payload, options);
  }

  verifyAccessToken(token: string) {
    try {
      const options: JwtVerifyOptions = {
        algorithms: ['RS256'],
      };
      const payload = this.jwtService.verify(token, options);
      return payload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token has expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid access token');
      }
      if (err.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      throw new UnauthorizedException('Access token verification failed');
    }
  }

  async getMe(req: Request): Promise<ResponseDto<UserResDto>> {
    const user = req.user as UserEntity;

    const email = user?.email;
    if (!email) {
      throw new UnauthorizedException('Email not found in user data');
    }

    const userData = await this.userService.findOneByEmail(email);

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    return new ResponseDto<UserResDto>({
      data: plainToInstance(UserResDto, userData, {
        excludeExtraneousValues: true,
      }),
      message: 'User retrieved successfully',
    });
  }
}
