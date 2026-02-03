import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123xyz789',
    description: 'Token de recuperación recibido por email',
  })
  @IsNotEmpty({ message: 'El token es requerido' })
  @IsString({ message: 'El token debe ser texto' })
  token!: string;

  @ApiProperty({
    example: 'NuevaPassword123!',
    description: 'Nueva contraseña (mínimo 8 caracteres)',
  })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword!: string;
}
