import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
