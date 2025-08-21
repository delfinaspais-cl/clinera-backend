-- AlterTable
ALTER TABLE "public"."Clinica" ADD COLUMN     "fuente" TEXT DEFAULT 'owner_dashboard',
ADD COLUMN     "pendienteAprobacion" BOOLEAN NOT NULL DEFAULT false;
