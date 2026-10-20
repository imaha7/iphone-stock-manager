import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCostDto } from './dto/create-cost.dto';

@Injectable()
export class CostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(startDate?: string, endDate?: string) {
    const where: Prisma.AdditionalCostWhereInput = {};
    if (startDate || endDate) {
      const date: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        date.lte = end;
      }
      where.date = date;
    }

    return this.prisma.additionalCost.findMany({
      where,
      include: { sale: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const cost = await this.prisma.additionalCost.findUnique({
      where: { id },
      include: { sale: true },
    });

    if (!cost) {
      throw new NotFoundException(`Additional cost with ID ${id} not found`);
    }

    return cost;
  }

  async create(dto: CreateCostDto) {
    return this.prisma.additionalCost.create({
      data: {
        saleId: dto.saleId,
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
      include: { sale: true },
    });
  }

  async update(id: number, dto: Partial<CreateCostDto>) {
    await this.findOne(id);

    return this.prisma.additionalCost.update({
      where: { id },
      data: {
        ...(dto.saleId !== undefined && { saleId: dto.saleId }),
        ...(dto.description && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.category && { category: dto.category }),
        ...(dto.date && { date: new Date(dto.date) }),
      },
      include: { sale: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.additionalCost.delete({
      where: { id },
    });
  }
}
