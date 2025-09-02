/*
  Warnings:

  - You are about to drop the column `specialties` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `tratamientos` on the `Professional` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Professional" DROP COLUMN "specialties",
DROP COLUMN "tratamientos";

-- CreateTable
CREATE TABLE "public"."Tratamiento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "precio" DOUBLE PRECISION,
    "clinicaId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalEspecialidad" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "especialidadId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalEspecialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfessionalTratamiento" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tratamientoId" TEXT NOT NULL,
    "precio" DOUBLE PRECISION,
    "duracionMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalTratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tratamiento_clinicaId_idx" ON "public"."Tratamiento"("clinicaId");

-- CreateIndex
CREATE INDEX "Tratamiento_estado_idx" ON "public"."Tratamiento"("estado");

-- CreateIndex
CREATE INDEX "ProfessionalEspecialidad_professionalId_idx" ON "public"."ProfessionalEspecialidad"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalEspecialidad_especialidadId_idx" ON "public"."ProfessionalEspecialidad"("especialidadId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalEspecialidad_professionalId_especialidadId_key" ON "public"."ProfessionalEspecialidad"("professionalId", "especialidadId");

-- CreateIndex
CREATE INDEX "ProfessionalTratamiento_professionalId_idx" ON "public"."ProfessionalTratamiento"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalTratamiento_tratamientoId_idx" ON "public"."ProfessionalTratamiento"("tratamientoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalTratamiento_professionalId_tratamientoId_key" ON "public"."ProfessionalTratamiento"("professionalId", "tratamientoId");

-- AddForeignKey
ALTER TABLE "public"."Tratamiento" ADD CONSTRAINT "Tratamiento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalEspecialidad" ADD CONSTRAINT "ProfessionalEspecialidad_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalEspecialidad" ADD CONSTRAINT "ProfessionalEspecialidad_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "public"."Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalTratamiento" ADD CONSTRAINT "ProfessionalTratamiento_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfessionalTratamiento" ADD CONSTRAINT "ProfessionalTratamiento_tratamientoId_fkey" FOREIGN KEY ("tratamientoId") REFERENCES "public"."Tratamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
