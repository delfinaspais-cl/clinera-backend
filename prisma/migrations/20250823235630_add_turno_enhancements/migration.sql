-- AlterTable
ALTER TABLE "public"."Clinica" ALTER COLUMN "estado" SET DEFAULT 'activo';

-- AlterTable
ALTER TABLE "public"."Turno" ADD COLUMN     "duracionMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "professionalId" TEXT,
ADD COLUMN     "servicio" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Turno" ADD CONSTRAINT "Turno_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
