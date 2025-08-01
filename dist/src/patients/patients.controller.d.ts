import { PatientsService } from './patients.service';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    findAll(req: any): import("@prisma/client").Prisma.PrismaPromise<({
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
