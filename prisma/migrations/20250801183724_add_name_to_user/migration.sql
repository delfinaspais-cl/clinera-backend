/*
  Warnings:

  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Professional` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Professional" DROP CONSTRAINT "Professional_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "isActive",
ADD COLUMN     "name" TEXT;

-- DropTable
DROP TABLE "public"."Admin";

-- DropTable
DROP TABLE "public"."Patient";

-- DropTable
DROP TABLE "public"."Professional";
