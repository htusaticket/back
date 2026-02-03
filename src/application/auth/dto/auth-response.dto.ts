import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+52 55 1234 5678' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Ciudad de México' })
  city?: string | null;

  @ApiPropertyOptional({ example: 'México' })
  country?: string | null;

  @ApiPropertyOptional({ example: 'Instagram' })
  reference?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string | null;

  @ApiProperty({ example: 'USER', enum: ['ADMIN', 'USER', 'GUEST', 'MODERATOR'] })
  role!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  status!: string;

  @ApiProperty({ example: '2026-02-02T10:00:00.000Z' })
  createdAt!: Date;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Operación exitosa' })
  message!: string;
}
