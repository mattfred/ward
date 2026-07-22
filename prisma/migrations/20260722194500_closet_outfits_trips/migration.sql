-- CreateTable
CREATE TABLE IF NOT EXISTS "ClosetItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "color" TEXT,
    "brand" TEXT,
    "notes" TEXT,
    "imageData" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "wearCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornAt" TIMESTAMP(3),
    "condition" TEXT NOT NULL DEFAULT 'good',
    "season" TEXT NOT NULL DEFAULT 'all',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "blueprintPieceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClosetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Outfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "itemIds" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "occasion" TEXT,
    "imageData" TEXT,
    "wearCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TripWardrobe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "itemIds" TEXT NOT NULL DEFAULT '[]',
    "outfitIds" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "packingChecklist" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripWardrobe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClosetItem_userId_idx" ON "ClosetItem"("userId");
CREATE INDEX IF NOT EXISTS "ClosetItem_userId_blueprintPieceId_idx" ON "ClosetItem"("userId", "blueprintPieceId");
CREATE INDEX IF NOT EXISTS "Outfit_userId_idx" ON "Outfit"("userId");
CREATE INDEX IF NOT EXISTS "TripWardrobe_userId_idx" ON "TripWardrobe"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ClosetItem" ADD CONSTRAINT "ClosetItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TripWardrobe" ADD CONSTRAINT "TripWardrobe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
