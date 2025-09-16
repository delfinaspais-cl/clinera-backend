-- Force resolve Railway migration issue
-- This migration handles the failed migration in production

-- First, clean up any partial state from the failed migration
DROP INDEX IF EXISTS "public"."User_email_clinicaId_key";
DROP INDEX IF EXISTS "public"."User_clinicaId_idx";
DROP INDEX IF EXISTS "public"."User_email_idx";

-- Remove any duplicate users (keep the most recent one)
DELETE FROM "User" 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY email, "clinicaId" ORDER BY "createdAt" DESC) as rn
        FROM "User" 
        WHERE "clinicaId" IS NOT NULL
    ) t 
    WHERE rn > 1
);

-- Ensure the original unique constraint exists
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");

-- Create the indexes that were intended in the original migration
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "public"."User"("email");
CREATE INDEX IF NOT EXISTS "User_clinicaId_idx" ON "public"."User"("clinicaId");
