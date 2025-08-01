import { PrismaService } from '../prisma/prisma.service';
export declare class PatientsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
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
        birthDate: Date | null;
        phone: string | null;
        notes: string | null;
        userId: string;
    })[]>;
}
