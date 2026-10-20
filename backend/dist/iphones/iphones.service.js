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
exports.IphonesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let IphonesService = class IphonesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
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
    async findOne(id) {
        const iphone = await this.prisma.iPhoneUnit.findUnique({
            where: { id },
            include: {
                purchase: true,
                sales: { include: { additionalCosts: true } },
            },
        });
        if (!iphone) {
            throw new common_1.NotFoundException(`iPhone unit with ID ${id} not found`);
        }
        return iphone;
    }
    async create(dto) {
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`iPhone unit with IMEI ${dto.imei ?? ''} already exists`);
            }
            throw error;
        }
    }
    async update(id, dto) {
        await this.findOne(id);
        try {
            return await this.prisma.iPhoneUnit.update({
                where: { id },
                data: dto,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`iPhone unit with IMEI ${dto.imei ?? ''} already exists`);
            }
            throw error;
        }
    }
    async remove(id) {
        const iphone = await this.findOne(id);
        if (iphone.status === 'sold') {
            throw new common_1.BadRequestException('This unit cannot be deleted because it has already been sold. Cancel the sale first to remove it.');
        }
        return this.prisma.iPhoneUnit.delete({
            where: { id },
        });
    }
};
exports.IphonesService = IphonesService;
exports.IphonesService = IphonesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IphonesService);
//# sourceMappingURL=iphones.service.js.map