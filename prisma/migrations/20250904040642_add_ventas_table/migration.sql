-- CreateTable
CREATE TABLE "public"."Venta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "comprador" TEXT NOT NULL,
    "paciente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tratamiento" TEXT NOT NULL,
    "profesional" TEXT NOT NULL,
    "profesionalId" TEXT,
    "sucursal" TEXT NOT NULL,
    "montoTotal" TEXT NOT NULL,
    "montoAbonado" TEXT NOT NULL,
    "montoPendiente" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "medioPago" TEXT,
    "origen" TEXT,
    "ate" TEXT,
    "sesiones" INTEGER NOT NULL DEFAULT 1,
    "sesionesUsadas" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "clinicaId" TEXT NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venta_ventaId_key" ON "public"."Venta"("ventaId");

-- CreateIndex
CREATE INDEX "Venta_clinicaId_idx" ON "public"."Venta"("clinicaId");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "public"."Venta"("estado");

-- CreateIndex
CREATE INDEX "Venta_estadoPago_idx" ON "public"."Venta"("estadoPago");

-- CreateIndex
CREATE INDEX "Venta_fechaCreacion_idx" ON "public"."Venta"("fechaCreacion");

-- AddForeignKey
ALTER TABLE "public"."Venta" ADD CONSTRAINT "Venta_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
