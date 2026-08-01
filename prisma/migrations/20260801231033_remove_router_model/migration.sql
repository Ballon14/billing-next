/*
  Warnings:

  - You are about to drop the column `routerId` on the `pppoeaccount` table. All the data in the column will be lost.
  - You are about to drop the `router` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `pppoeaccount` DROP FOREIGN KEY `PppoeAccount_routerId_fkey`;

-- AlterTable
ALTER TABLE `pppoeaccount` DROP COLUMN `routerId`;

-- DropTable
DROP TABLE `router`;
