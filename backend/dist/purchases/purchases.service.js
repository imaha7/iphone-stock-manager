"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PurchasesService = class PurchasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
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
    async findOne(id) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { iphoneUnit: true },
        });
        if (!purchase) {
            throw new common_1.NotFoundException(`Purchase with ID ${id} was not found`);
        }
        return purchase;
    }
    async create(dto) {
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`An iPhone unit with IMEI ${dto.imei} already exists`);
            }
            throw error;
        }
    }
    async update(id, dto) {
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
                        throw new common_1.BadRequestException(`Purchase quantity cannot be less than the number of units already sold (${soldQuantity}).`);
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
                const unitUpdateData = {};
                if (dto.model !== undefined)
                    unitUpdateData.model = dto.model;
                if (dto.capacity !== undefined)
                    unitUpdateData.capacity = dto.capacity;
                if (dto.color !== undefined)
                    unitUpdateData.color = dto.color;
                if (dto.imei !== undefined)
                    unitUpdateData.imei = dto.imei;
                if (dto.purchasePrice !== undefined)
                    unitUpdateData.purchasePrice = dto.purchasePrice;
                if (Object.keys(unitUpdateData).length > 0) {
                    await tx.iPhoneUnit.update({
                        where: { id: purchase.iphoneUnitId },
                        data: unitUpdateData,
                    });
                }
                const purchaseUpdateData = {};
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`An iPhone unit with IMEI ${dto.imei ?? ''} already exists`);
            }
            throw error;
        }
    }
    async remove(id) {
        const purchase = await this.findOne(id);
        if (purchase.iphoneUnit && purchase.iphoneUnit.status === 'sold') {
            throw new common_1.BadRequestException('This purchase cannot be deleted because the iPhone unit has already been sold. Cancel the sale first to remove this purchase record.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.purchase.delete({ where: { id } });
            await tx.iPhoneUnit.delete({ where: { id: purchase.iphoneUnitId } });
            return purchase;
        });
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map