import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../persistence/prisma/prisma.service';

interface PrismaError extends Error {
  code?: string;
}

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: keyof PrismaService,
  ) {}

  async findAll(options?: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
  }): Promise<T[]> {
    const model = this.prisma[this.modelName] as any;
    return model.findMany(options);
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    const model = this.prisma[this.modelName] as any;
    return model.count({ where });
  }

  async findById(id: string, include?: Record<string, unknown>): Promise<T> {
    const model = this.prisma[this.modelName] as any;
    const record = await model.findUnique({
      where: { id },
      include,
    });

    if (!record) {
      throw new NotFoundException(`${String(this.modelName)} con ID '${id}' no encontrado`);
    }

    return record;
  }

  async findByField(field: string, value: unknown, include?: Record<string, unknown>): Promise<T> {
    const where = { [field]: value };
    const model = this.prisma[this.modelName] as any;
    const record = await model.findFirst({
      where,
      include,
    });

    if (!record) {
      throw new NotFoundException(
        `${String(this.modelName)} con ${field} '${String(value)}' no encontrado`,
      );
    }

    return record;
  }

  async create(data: CreateDto): Promise<T> {
    const model = this.prisma[this.modelName] as any;
    return model.create({
      data,
    });
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      const model = this.prisma[this.modelName] as any;
      return await model.update({
        where: { id },
        data,
      });
    } catch (error) {
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new NotFoundException(`${String(this.modelName)} con ID '${id}' no encontrado`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<T> {
    try {
      const model = this.prisma[this.modelName] as any;
      return await model.delete({
        where: { id },
      });
    } catch (error) {
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new NotFoundException(`${String(this.modelName)} con ID '${id}' no encontrado`);
      }
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    const model = this.prisma[this.modelName] as any;
    return model.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
