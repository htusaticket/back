import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { AuditLogService } from '@/application/admin/services/audit-log.service';
import { GetAuditLogsQueryDto, AuditLogsResponseDto } from '@/application/admin/dto/audit-log.dto';

@ApiTags('Audit Logs')
@Controller('api/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogController {
  private readonly logger = new Logger(AuditLogController.name);

  constructor(private readonly auditService: AuditLogService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get audit logs (SUPERADMIN only)' })
  @ApiResponse({ status: 200, type: AuditLogsResponseDto })
  async getLogs(@Query() query: GetAuditLogsQueryDto): Promise<AuditLogsResponseDto> {
    this.logger.debug(`Fetching audit logs with query: ${JSON.stringify(query)}`);
    return this.auditService.getLogs(query);
  }
}
