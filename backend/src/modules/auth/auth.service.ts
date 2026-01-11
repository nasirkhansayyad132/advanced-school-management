import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    await this.createRefreshToken(user.id);

    return {
      accessToken,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenValue: string): Promise<{ accessToken: string; expiresIn: number }> {
    const tokenHash = await this.hashToken(refreshTokenValue);
    
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!token.user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { isRevoked: true },
    });
    await this.createRefreshToken(token.userId);

    const accessToken = this.generateAccessToken(token.user);

    return {
      accessToken,
      expiresIn: 900,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
      },
    });
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
