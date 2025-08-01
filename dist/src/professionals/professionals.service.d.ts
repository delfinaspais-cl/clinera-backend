import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
export declare class ProfessionalsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateProfessionalDto): Promise<{
        professional: {
            id: string;
            createdAt: Date;
            name: string;
            specialties: string[];
            defaultDurationMin: number;
            bufferMin: number;
            userId: string;
        } | null;
    } & {
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        user: {
            id: string;
            email: string;
            password: string;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        specialties: string[];
        defaultDurationMin: number;
        bufferMin: number;
        userId: string;
    })[]>;
}
