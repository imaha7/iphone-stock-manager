import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { startDate?: string; endDate?: string }) {
    const where: Prisma.SaleWhereInput = {};

    if (query?.startDate || query?.endDate) {
      where.saleDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        where.saleDate.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        iphoneUnit: true,
        additionalCosts: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        iphoneUnit: true,
        additionalCosts: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sales transaction with ID ${id} was not found`);
    }

    return sale;
  }

  async create(dto: CreateSaleDto) {
    const iphoneUnit = await this.prisma.iPhoneUnit.findUnique({
      where: { id: dto.iphoneUnitId },
    });

    if (!iphoneUnit) {
      throw new NotFoundException(
        `iPhone unit with ID ${dto.iphoneUnitId} was not found`,
      );
    }

    if (iphoneUnit.status === 'sold' || iphoneUnit.quantity <= 0) {
      throw new BadRequestException(
        `iPhone ${iphoneUnit.model} (${iphoneUnit.imei}) is out of stock`,
      );
    }

    const saleQty = dto.quantity ?? 1;

    if (saleQty > iphoneUnit.quantity) {
      throw new BadRequestException(
        `Sale quantity (${saleQty}) exceeds the available stock (${iphoneUnit.quantity})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const remainingQty = iphoneUnit.quantity - saleQty;
      const stockUpdate = await tx.iPhoneUnit.updateMany({
        where: {
          id: dto.iphoneUnitId,
          quantity: iphoneUnit.quantity,
          status: 'available',
        },
        data: {
          quantity: remainingQty,
          status: remainingQty === 0 ? 'sold' : 'available',
          sellingPrice: dto.sellingPrice / saleQty,
        },
      });
      if (stockUpdate.count !== 1) {
        throw new BadRequestException(
          'Stock changed while processing this sale. Refresh the data and try again.',
        );
      }

      const saleDateObj = dto.saleDate ? new Date(dto.saleDate) : new Date();

      const saleData: Prisma.SaleCreateInput = {
        iphoneUnit: { connect: { id: dto.iphoneUnitId } },
        quantity: saleQty,
        sellingPrice: dto.sellingPrice,
        buyerName: dto.buyerName,
        buyerPhone: dto.buyerPhone,
        saleDate: saleDateObj,
        notes: dto.notes,
      };

      const sale = await tx.sale.create({
        data: saleData,
      });

      if (dto.additionalCosts && dto.additionalCosts.length > 0) {
        await tx.additionalCost.createMany({
          data: dto.additionalCosts.map((cost) => ({
            saleId: sale.id,
            description: cost.description,
            amount: cost.amount,
            category: cost.category,
            date: saleDateObj,
          })),
        });
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          iphoneUnit: true,
          additionalCosts: true,
        },
      });
    });
  }

  async remove(id: number) {
    const sale = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.additionalCost.deleteMany({ where: { saleId: id } });
      await tx.sale.delete({ where: { id } });

      // Restore quantity back to the unit and mark as available
      await tx.iPhoneUnit.update({
        where: { id: sale.iphoneUnitId },
        data: {
          quantity: { increment: sale.quantity },
          status: 'available',
        },
      });

      return sale;
    });
  }
}
