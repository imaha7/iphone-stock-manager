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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SalesService = class SalesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
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
    async findOne(id) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                iphoneUnit: true,
                additionalCosts: true,
            },
        });
        if (!sale) {
            throw new common_1.NotFoundException(`Sales transaction with ID ${id} was not found`);
        }
        return sale;
    }
    async create(dto) {
        const iphoneUnit = await this.prisma.iPhoneUnit.findUnique({
            where: { id: dto.iphoneUnitId },
        });
        if (!iphoneUnit) {
            throw new common_1.NotFoundException(`iPhone unit with ID ${dto.iphoneUnitId} was not found`);
        }
        if (iphoneUnit.status === 'sold' || iphoneUnit.quantity <= 0) {
            throw new common_1.BadRequestException(`iPhone ${iphoneUnit.model} (${iphoneUnit.imei}) is out of stock`);
        }
        const saleQty = dto.quantity ?? 1;
        if (saleQty > iphoneUnit.quantity) {
            throw new common_1.BadRequestException(`Sale quantity (${saleQty}) exceeds the available stock (${iphoneUnit.quantity})`);
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
                throw new common_1.BadRequestException('Stock changed while processing this sale. Refresh the data and try again.');
            }
            const saleDateObj = dto.saleDate ? new Date(dto.saleDate) : new Date();
            const saleData = {
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
    async remove(id) {
        const sale = await this.findOne(id);
        return this.prisma.$transaction(async (tx) => {
            await tx.additionalCost.deleteMany({ where: { saleId: id } });
            await tx.sale.delete({ where: { id } });
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map