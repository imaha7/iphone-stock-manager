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
exports.CostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CostsService = class CostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            const date = {};
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
    async findOne(id) {
        const cost = await this.prisma.additionalCost.findUnique({
            where: { id },
            include: { sale: true },
        });
        if (!cost) {
            throw new common_1.NotFoundException(`Additional cost with ID ${id} not found`);
        }
        return cost;
    }
    async create(dto) {
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
    async update(id, dto) {
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
    async remove(id) {
        await this.findOne(id);
        return this.prisma.additionalCost.delete({
            where: { id },
        });
    }
};
exports.CostsService = CostsService;
exports.CostsService = CostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostsService);
//# sourceMappingURL=costs.service.js.map