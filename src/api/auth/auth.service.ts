import { UserResDto } from '@/api/users/dto/user.res.dto';
import { UserEntity } from '@/api/users/entities/user.entity';
import { UserService } from '@/api/users/user.service';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Uuid } from '@/common/types/common.type';
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

  async generateTokenForDev(userId: Uuid): Promise<{ accessToken: string }> {
    // Lấy user từ DB để đảm bảo userId hợp lệ
    const user = await this.userService.findOne(userId);
    if (!user?.data) {
      throw new UnauthorizedException('User không tồn tại');
    }
    const payload = {
      id: user.data.id,
      email: user.data.email,
      role: user.data.role,
      iat: Math.floor(Date.now() / 1000),
    };
    const options: JwtSignOptions = {
      algorithm: 'RS256',
    };
    const accessToken = this.jwtService.sign(payload, options);
    return { accessToken };
  }

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
        throw new UnauthorizedException('Token đã hết hạn');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token không hợp lệ');
      }
      if (err.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token chưa hoạt động');
      }
      throw new UnauthorizedException('Xác thực token không thành công');
    }
  }

  async getMe(req: Request): Promise<ResponseDto<UserResDto>> {
    const user = req.user as UserEntity;

    const email = user?.email;
    if (!email) {
      throw new UnauthorizedException(
        'Email không tìm thấy trong dữ liệu người dùng',
      );
    }

    const userData = await this.userService.findOneByEmail(email);

    if (!userData) {
      throw new UnauthorizedException('Người dùng không tìm thấy');
    }

    return new ResponseDto<UserResDto>({
      data: plainToInstance(UserResDto, userData, {
        excludeExtraneousValues: true,
      }),
      message: 'Lấy thông tin người dùng thành công',
    });
  }
}
