-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateTable
CREATE TABLE "PositionRequirement" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "shift" "Shift" NOT NULL DEFAULT 'MORNING',
    "position" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionRequirement_churchId_idx" ON "PositionRequirement"("churchId");

-- CreateIndex
CREATE INDEX "PositionRequirement_serviceTypeId_idx" ON "PositionRequirement"("serviceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionRequirement_serviceTypeId_shift_position_key" ON "PositionRequirement"("serviceTypeId", "shift", "position");

-- AddForeignKey
ALTER TABLE "PositionRequirement" ADD CONSTRAINT "PositionRequirement_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionRequirement" ADD CONSTRAINT "PositionRequirement_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
