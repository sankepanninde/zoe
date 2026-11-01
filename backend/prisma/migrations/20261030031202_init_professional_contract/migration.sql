/*
  Warnings:

  - You are about to drop the column `churchId` on the `refreshtoken` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `refreshtoken` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `refreshtoken` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(1))`.
  - Added the required column `familyId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_ministryId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `availability` DROP FOREIGN KEY `Availability_userId_fkey`;

-- DropForeignKey
ALTER TABLE `availabilityblock` DROP FOREIGN KEY `AvailabilityBlock_userId_fkey`;

-- DropForeignKey
ALTER TABLE `availabilityservice` DROP FOREIGN KEY `AvailabilityService_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `availabilityservice` DROP FOREIGN KEY `AvailabilityService_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ministry` DROP FOREIGN KEY `Ministry_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `positionrequirement` DROP FOREIGN KEY `PositionRequirement_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `positionrequirement` DROP FOREIGN KEY `PositionRequirement_serviceTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `refreshtoken` DROP FOREIGN KEY `RefreshToken_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `refreshtoken` DROP FOREIGN KEY `RefreshToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_serviceTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `servicetype` DROP FOREIGN KEY `ServiceType_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `userministry` DROP FOREIGN KEY `UserMinistry_ministryId_fkey`;

-- DropForeignKey
ALTER TABLE `userministry` DROP FOREIGN KEY `UserMinistry_userId_fkey`;

-- DropIndex
DROP INDEX `AvailabilityBlock_userId_desde_hasta_idx` ON `availabilityblock`;

-- DropIndex
DROP INDEX `RefreshToken_churchId_idx` ON `refreshtoken`;

-- DropIndex
DROP INDEX `RefreshToken_expiresAt_idx` ON `refreshtoken`;

-- AlterTable
ALTER TABLE `assignment` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `availabilityblock` ADD COLUMN `repite` ENUM('NINGUNA', 'ANUAL', 'MENSUAL') NOT NULL DEFAULT 'NINGUNA';

-- AlterTable
ALTER TABLE `refreshtoken` DROP COLUMN `churchId`,
    DROP COLUMN `ipAddress`,
    DROP COLUMN `userAgent`,
    ADD COLUMN `familyId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `service` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('LEADER', 'ADMIN', 'DEV', 'SIERVO') NOT NULL DEFAULT 'SIERVO';

-- CreateIndex
CREATE INDEX `RefreshToken_familyId_idx` ON `RefreshToken`(`familyId`);
