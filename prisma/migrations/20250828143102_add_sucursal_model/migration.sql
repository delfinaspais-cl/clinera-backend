-- CreateTable
CREATE TABLE "public"."Sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "clinicaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sucursal_clinicaId_idx" ON "public"."Sucursal"("clinicaId");

-- CreateIndex
CREATE INDEX "Sucursal_estado_idx" ON "public"."Sucursal"("estado");

-- AddForeignKey
ALTER TABLE "public"."Sucursal" ADD CONSTRAINT "Sucursal_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
