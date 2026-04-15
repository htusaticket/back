// Public branding config — accesible sin auth para login/register/emails/front alumno.
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';

@ApiTags('Public Config')
@Controller('api/public/config')
export class PublicConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Branding público (logo, etc.)' })
  async get(): Promise<{ logoUrl: string | null }> {
    const cfg = await this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
    return { logoUrl: cfg?.logoUrl ?? null };
  }
}
