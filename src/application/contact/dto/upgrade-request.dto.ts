// src/application/contact/dto/upgrade-request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpgradeRequestDto {
  @ApiPropertyOptional({
    description: 'Mensaje opcional del usuario con la solicitud de upgrade',
    example: 'Me gustaría acceder a las clases en vivo y el Job Board.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
