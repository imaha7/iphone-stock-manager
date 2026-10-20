import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { startDate?: string; endDate?: string }) {
    const where: Prisma.PurchaseWhereInput = {};

    if (query?.startDate || query?.endDate) {
      where.purchaseDate = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        where.purchaseDate.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    return this.prisma.purchase.findMany({
      where,
      include: { iphoneUnit: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { iphoneUnit: true },
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} was not found`);
    }

    return purchase;
  }

  async create(dto: CreatePurchaseDto) {
    const qty = dto.quantity ?? 1;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const iphoneUnit = await tx.iPhoneUnit.create({
          data: {
            model: dto.model,
            capacity: dto.capacity,
            color: dto.color,
            imei: dto.imei,
            purchasePrice: dto.purchasePrice,
            quantity: qty,
            status: 'available',
          },
        });

        const purchase = await tx.purchase.create({
          data: {
            iphoneUnitId: iphoneUnit.id,
            quantity: qty,
            supplier: dto.supplier,
            purchaseDate: dto.purchaseDate
              ? new Date(dto.purchaseDate)
              : new Date(),
            notes: dto.notes,
          },
          include: { iphoneUnit: true },
        });

        return purchase;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `An iPhone unit with IMEI ${dto.imei} already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdatePurchaseDto) {
    const purchase = await this.findOne(id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.quantity !== undefined) {
          const sales = await tx.sale.aggregate({
            where: { iphoneUnitId: purchase.iphoneUnitId },
            _sum: { quantity: true },
          });
          const soldQuantity = sales._sum.quantity ?? 0;
          if (dto.quantity < soldQuantity) {
            throw new BadRequestException(
              `Purchase quantity cannot be less than the number of units already sold (${soldQuantity}).`,
            );
          }

          const availableQuantity = dto.quantity - soldQuantity;
          await tx.iPhoneUnit.update({
            where: { id: purchase.iphoneUnitId },
            data: {
              quantity: availableQuantity,
              status: availableQuantity === 0 ? 'sold' : 'available',
            },
          });
        }

        // Update IPhoneUnit fields
        const unitUpdateData: Prisma.IPhoneUnitUpdateInput = {};
        if (dto.model !== undefined) unitUpdateData.model = dto.model;
        if (dto.capacity !== undefined) unitUpdateData.capacity = dto.capacity;
        if (dto.color !== undefined) unitUpdateData.color = dto.color;
        if (dto.imei !== undefined) unitUpdateData.imei = dto.imei;
        if (dto.purchasePrice !== undefined)
          unitUpdateData.purchasePrice = dto.purchasePrice;

        if (Object.keys(unitUpdateData).length > 0) {
          await tx.iPhoneUnit.update({
            where: { id: purchase.iphoneUnitId },
            data: unitUpdateData,
          });
        }

        // Update Purchase fields
        const purchaseUpdateData: Prisma.PurchaseUpdateInput = {};
        if (dto.supplier !== undefined)
          purchaseUpdateData.supplier = dto.supplier;
        if (dto.notes !== undefined)
          purchaseUpdateData.notes = dto.notes;
        if (dto.quantity !== undefined)
          purchaseUpdateData.quantity = dto.quantity;
        if (dto.purchaseDate !== undefined)
          purchaseUpdateData.purchaseDate = new Date(dto.purchaseDate);

        const updatedPurchase = await tx.purchase.update({
          where: { id },
          data: purchaseUpdateData,
          include: { iphoneUnit: true },
        });

        return updatedPurchase;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `An iPhone unit with IMEI ${dto.imei ?? ''} already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    const purchase = await this.findOne(id);

    if (purchase.iphoneUnit && purchase.iphoneUnit.status === 'sold') {
      throw new BadRequestException(
        'This purchase cannot be deleted because the iPhone unit has already been sold. Cancel the sale first to remove this purchase record.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.purchase.delete({ where: { id } });
      await tx.iPhoneUnit.delete({ where: { id: purchase.iphoneUnitId } });
      return purchase;
    });
  }
}
