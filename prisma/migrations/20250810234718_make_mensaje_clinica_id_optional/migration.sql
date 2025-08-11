-- DropForeignKey
ALTER TABLE "public"."Mensaje" DROP CONSTRAINT "Mensaje_clinicaId_fkey";

-- AlterTable
ALTER TABLE "public"."Mensaje" ALTER COLUMN "clinicaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Mensaje" ADD CONSTRAINT "Mensaje_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
