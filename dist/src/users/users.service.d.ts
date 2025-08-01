import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        patient: {
            id: string;
            createdAt: Date;
            name: string;
            userId: string;
            birthDate: Date | null;
            phone: string | null;
            notes: string | null;
        } | null;
        professional: {
            id: string;
            createdAt: Date;
            name: string;
            userId: string;
            specialties: string[];
            defaultDurationMin: number;
            bufferMin: number;
        } | null;
    } & {
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
