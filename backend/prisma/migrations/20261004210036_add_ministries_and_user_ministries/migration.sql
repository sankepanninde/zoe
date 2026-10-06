-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "ministryId" TEXT;

-- CreateTable
CREATE TABLE "Ministry" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMinistry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMinistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ministry_churchId_idx" ON "Ministry"("churchId");

-- CreateIndex
CREATE INDEX "Ministry_active_idx" ON "Ministry"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Ministry_churchId_name_key" ON "Ministry"("churchId", "name");

-- CreateIndex
CREATE INDEX "UserMinistry_userId_idx" ON "UserMinistry"("userId");

-- CreateIndex
CREATE INDEX "UserMinistry_ministryId_idx" ON "UserMinistry"("ministryId");

-- CreateIndex
CREATE INDEX "UserMinistry_isLeader_idx" ON "UserMinistry"("isLeader");

-- CreateIndex
CREATE UNIQUE INDEX "UserMinistry_userId_ministryId_key" ON "UserMinistry"("userId", "ministryId");

-- CreateIndex
CREATE INDEX "Assignment_ministryId_idx" ON "Assignment"("ministryId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ministry" ADD CONSTRAINT "Ministry_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMinistry" ADD CONSTRAINT "UserMinistry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMinistry" ADD CONSTRAINT "UserMinistry_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
