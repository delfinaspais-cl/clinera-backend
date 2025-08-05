-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paciente" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "especialidad" TEXT NOT NULL,
    "doctor" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "motivo" TEXT,
    "clinicaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Turno_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
