-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "clinicaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mensaje_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
