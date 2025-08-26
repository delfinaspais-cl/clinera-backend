-- AlterTable
ALTER TABLE "public"."Turno" ADD COLUMN     "ate" TEXT,
ADD COLUMN     "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "medioPago" TEXT,
ADD COLUMN     "montoTotal" TEXT,
ADD COLUMN     "origen" TEXT;
