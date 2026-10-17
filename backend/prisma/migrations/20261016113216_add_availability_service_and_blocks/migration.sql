-- CreateEnum
CREATE TYPE "AvailabilityState" AS ENUM ('DISPONIBLE', 'NO_DISPONIBLE');

-- CreateTable
CREATE TABLE "AvailabilityService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "estado" "AvailabilityState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityService_userId_idx" ON "AvailabilityService"("userId");

-- CreateIndex
CREATE INDEX "AvailabilityService_serviceId_idx" ON "AvailabilityService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityService_userId_serviceId_key" ON "AvailabilityService"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_userId_idx" ON "AvailabilityBlock"("userId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_userId_desde_hasta_idx" ON "AvailabilityBlock"("userId", "desde", "hasta");

-- AddForeignKey
ALTER TABLE "AvailabilityService" ADD CONSTRAINT "AvailabilityService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityService" ADD CONSTRAINT "AvailabilityService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
