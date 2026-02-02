import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar el estado de la aplicación' })
  @ApiResponse({
    status: 200,
    description: 'La aplicación está funcionando correctamente',
  })
  async check() {
    // Verificar conexión a la base de datos
    let dbStatus = 'UP';
    let dbMessage = 'Connection established';

    try {
      // Realizar una consulta simple para verificar la conexión
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'DOWN';
      dbMessage = error instanceof Error ? error.message : 'Unknown database error';
    }

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          message: dbMessage,
        },
        api: {
          status: 'UP',
          version: process.env.npm_package_version || 'unknown',
        },
      },
    };
  }
}
