-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clinica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "colorPrimario" TEXT DEFAULT '#3B82F6',
    "colorSecundario" TEXT DEFAULT '#1E40AF',
    "estado" TEXT DEFAULT 'activa',
    "estadoPago" TEXT DEFAULT 'pagado',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoPago" DATETIME,
    "proximoPago" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Clinica" ("address", "createdAt", "email", "id", "name", "phone", "updatedAt", "url") SELECT "address", "createdAt", "email", "id", "name", "phone", "updatedAt", "url" FROM "Clinica";
DROP TABLE "Clinica";
ALTER TABLE "new_Clinica" RENAME TO "Clinica";
CREATE UNIQUE INDEX "Clinica_url_key" ON "Clinica"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
