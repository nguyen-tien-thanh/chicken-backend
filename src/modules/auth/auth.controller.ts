import { ApiAuthNoPermission, GetUser } from '@/common/decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @ApiAuthNoPermission()
  profile(@GetUser() user: User) {
    return this.authService.profile(user);
  }
}
