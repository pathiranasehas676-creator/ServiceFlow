import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorLogFilterDto } from './dto/error-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrorLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: ErrorLogFilterDto) {
    const page = Number(dto.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // FIXME: Prisma types are not syncing correctly in IDE, using any temporarily
    const where: any = {};

    if (dto.severity) {
      where.severity = dto.severity;
    }

    if (dto.dateFrom) {
      where.createdAt = {
        gte: new Date(dto.dateFrom),
      };
    }

    if (dto.dateTo) {
      const currentFilter = (where.createdAt as Prisma.DateTimeFilter) || {};
      where.createdAt = {
        ...currentFilter,
        lte: new Date(dto.dateTo),
      };
    }

    if (dto.q) {
      where.OR = [
        { message: { contains: dto.q, mode: 'insensitive' } },
        { path: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).errorLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
      }),
      (this.prisma as any).errorLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / page),
      },
    };
  }

  async findOne(id: string) {
    const log = await (this.prisma as any).errorLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Error log with ID ${id} not found`);
    }

    return log;
  }

  async create(data: any) {
    return (this.prisma as any).errorLog.create({
      data,
    });
  }
}
