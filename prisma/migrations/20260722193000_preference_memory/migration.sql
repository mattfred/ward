-- AlterTable
ALTER TABLE "StyleProfile" ADD COLUMN IF NOT EXISTS "preferenceMemory" TEXT NOT NULL DEFAULT '{}';
