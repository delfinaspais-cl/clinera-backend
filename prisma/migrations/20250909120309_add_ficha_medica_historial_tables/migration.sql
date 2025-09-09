-- CreateTable
CREATE TABLE "public"."FichaMedicaHistorial" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "grupoSanguineo" TEXT,
    "ocupacion" TEXT,
    "alergias" TEXT,
    "medicamentosActuales" TEXT,
    "antecedentesPatologicos" TEXT,
    "antecedentesQuirurgicos" TEXT,
    "antecedentesFamiliares" TEXT,
    "habitos" TEXT,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "evolucion" TEXT,
    "notasCambio" TEXT,
    "esVersionActual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaMedicaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FichaMedicaArchivo" (
    "id" TEXT NOT NULL,
    "fichaHistorialId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaMedicaArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_pacienteId_idx" ON "public"."FichaMedicaHistorial"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_clinicaId_idx" ON "public"."FichaMedicaHistorial"("clinicaId");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_version_idx" ON "public"."FichaMedicaHistorial"("version");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_esVersionActual_idx" ON "public"."FichaMedicaHistorial"("esVersionActual");

-- CreateIndex
CREATE INDEX "FichaMedicaHistorial_fechaCreacion_idx" ON "public"."FichaMedicaHistorial"("fechaCreacion");

-- CreateIndex
CREATE INDEX "FichaMedicaArchivo_fichaHistorialId_idx" ON "public"."FichaMedicaArchivo"("fichaHistorialId");

-- CreateIndex
CREATE INDEX "FichaMedicaArchivo_tipo_idx" ON "public"."FichaMedicaArchivo"("tipo");

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaHistorial" ADD CONSTRAINT "FichaMedicaHistorial_fichaMedica_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."FichaMedica"("pacienteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedicaArchivo" ADD CONSTRAINT "FichaMedicaArchivo_fichaHistorialId_fkey" FOREIGN KEY ("fichaHistorialId") REFERENCES "public"."FichaMedicaHistorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
