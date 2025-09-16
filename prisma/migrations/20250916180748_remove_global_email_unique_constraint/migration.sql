/*
  Warnings:

  - A unique constraint covering the columns `[email,clinicaId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."User_email_key";

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_clinicaId_idx" ON "public"."User"("clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_clinicaId_key" ON "public"."User"("email", "clinicaId");
