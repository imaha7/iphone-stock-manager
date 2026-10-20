import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIphoneDto } from './dto/create-iphone.dto';
import { UpdateIphoneDto } from './dto/update-iphone.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class IphonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { status?: string; search?: string }) {
    const where: Prisma.IPhoneUnitWhereInput = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.OR = [
        { model: { contains: query.search } },
        { imei: { contains: query.search } },
      ];
    }

    return this.prisma.iPhoneUnit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const iphone = await this.prisma.iPhoneUnit.findUnique({
      where: { id },
      include: {
        purchase: true,
        sales: { include: { additionalCosts: true } },
      },
    });

    if (!iphone) {
      throw new NotFoundException(`iPhone unit with ID ${id} not found`);
    }

    return iphone;
  }

  async create(dto: CreateIphoneDto) {
    try {
      return await this.prisma.iPhoneUnit.create({
        data: {
          model: dto.model,
          capacity: dto.capacity,
          color: dto.color,
          imei: dto.imei,
          purchasePrice: dto.purchasePrice,
          sellingPrice: dto.sellingPrice,
          quantity: dto.quantity ?? 1,
          status: dto.status ?? 'available',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `iPhone unit with IMEI ${dto.imei ?? ''} already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateIphoneDto) {
    await this.findOne(id);

    try {
      return await this.prisma.iPhoneUnit.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `iPhone unit with IMEI ${dto.imei ?? ''} already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    const iphone = await this.findOne(id);

    if (iphone.status === 'sold') {
      throw new BadRequestException(
        'This unit cannot be deleted because it has already been sold. Cancel the sale first to remove it.',
      );
    }

    return this.prisma.iPhoneUnit.delete({
      where: { id },
    });
  }
}
