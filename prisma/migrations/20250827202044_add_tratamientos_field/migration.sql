-- AlterTable
ALTER TABLE "public"."Professional" ADD COLUMN     "tratamientos" TEXT[] DEFAULT ARRAY[]::TEXT[];
