-- AlterTable
ALTER TABLE "public"."Professional" ADD COLUMN     "sucursalId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Professional" ADD CONSTRAINT "Professional_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "public"."Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
