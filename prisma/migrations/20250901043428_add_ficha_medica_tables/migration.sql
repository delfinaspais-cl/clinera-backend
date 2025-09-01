-- CreateTable
CREATE TABLE "public"."FichaMedica" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "grupoSanguineo" TEXT,
    "alergias" TEXT,
    "medicamentosActuales" TEXT,
    "antecedentesPatologicos" TEXT,
    "antecedentesQuirurgicos" TEXT,
    "antecedentesFamiliares" TEXT,
    "habitos" TEXT,
    "ocupacion" TEXT,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "evolucion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArchivoMedico" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamañoBytes" BIGINT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchivoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImagenMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "tamañoBytes" BIGINT,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagenMedica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_pacienteId_key" ON "public"."FichaMedica"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedica_pacienteId_idx" ON "public"."FichaMedica"("pacienteId");

-- CreateIndex
CREATE INDEX "FichaMedica_clinicaId_idx" ON "public"."FichaMedica"("clinicaId");

-- CreateIndex
CREATE INDEX "ArchivoMedico_fichaMedicaId_idx" ON "public"."ArchivoMedico"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "ImagenMedica_fichaMedicaId_idx" ON "public"."ImagenMedica"("fichaMedicaId");

-- AddForeignKey
ALTER TABLE "public"."FichaMedica" ADD CONSTRAINT "FichaMedica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichaMedica" ADD CONSTRAINT "FichaMedica_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArchivoMedico" ADD CONSTRAINT "ArchivoMedico_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "public"."FichaMedica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImagenMedica" ADD CONSTRAINT "ImagenMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "public"."FichaMedica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
