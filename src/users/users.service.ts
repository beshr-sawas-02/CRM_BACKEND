import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from './user.schema';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @ApiPropertyOptional() @IsOptional() isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MinLength(6) newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.userModel.find({ role: UserRole.AGENT }).select('-password').lean();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).select('-password');
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userModel.findByIdAndUpdate(id, { password: hashed });
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async deactivate(id: string) {
    await this.userModel.findByIdAndUpdate(id, { isActive: false });
    return { message: 'تم تعطيل الحساب' };
  }
}
