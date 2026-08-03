/*
  Warnings:

  - You are about to drop the column `routerId` on the `PppoeAccount` table. All the data in the column will be lost.
  - You are about to drop the `Router` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `PppoeAccount` DROP FOREIGN KEY `PppoeAccount_routerId_fkey`;

-- AlterTable
ALTER TABLE `PppoeAccount` DROP COLUMN `routerId`;

-- DropTable
DROP TABLE `Router`;
