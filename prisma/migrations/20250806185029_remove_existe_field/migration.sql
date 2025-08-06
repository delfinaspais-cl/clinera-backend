/*
  Warnings:

  - You are about to drop the column `url` on the `Clinica` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Clinica` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Clinica` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Clinica_url_key";

-- AlterTable
ALTER TABLE "public"."Clinica" DROP COLUMN "url",
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_slug_key" ON "public"."Clinica"("slug");
