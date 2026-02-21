import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  firstName!: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario',
  })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  lastName!: string;

  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Correo electrónico del usuario',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email!: string;

  @ApiProperty({
    example: '+52 55 1234 5678',
    description: 'Teléfono del usuario',
  })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser texto' })
  phone!: string;

  @ApiProperty({
    example: 'Ciudad de México',
    description: 'Ciudad del usuario',
  })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
  city!: string;

  @ApiProperty({
    example: 'México',
    description: 'País del usuario',
  })
  @IsNotEmpty({ message: 'El país es requerido' })
  @IsString({ message: 'El país debe ser texto' })
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  country!: string;

  @ApiPropertyOptional({
    example: 'Instagram',
    description: '¿Cómo nos conociste?',
  })
  @IsOptional()
  @IsString({ message: 'La referencia debe ser texto' })
  @MaxLength(100, { message: 'La referencia no puede exceder 100 caracteres' })
  reference?: string;

  @ApiProperty({
    example: 'MiPassword123!',
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password!: string;
}
