import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'example@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'password',
  })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'example@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'password',
  })
  password: string;
}
