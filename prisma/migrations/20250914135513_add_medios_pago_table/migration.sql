-- AlterTable
ALTER TABLE "public"."Venta" ADD COLUMN     "medioPagoId" TEXT;

-- CreateTable
CREATE TABLE "public"."MedioPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedioPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedioPago_clinicaId_idx" ON "public"."MedioPago"("clinicaId");

-- CreateIndex
CREATE INDEX "MedioPago_activo_idx" ON "public"."MedioPago"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "MedioPago_nombre_clinicaId_key" ON "public"."MedioPago"("nombre", "clinicaId");

-- CreateIndex
CREATE INDEX "Venta_medioPagoId_idx" ON "public"."Venta"("medioPagoId");

-- AddForeignKey
ALTER TABLE "public"."MedioPago" ADD CONSTRAINT "MedioPago_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venta" ADD CONSTRAINT "Venta_medioPagoId_fkey" FOREIGN KEY ("medioPagoId") REFERENCES "public"."MedioPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
