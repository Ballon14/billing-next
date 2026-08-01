-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `payload` VARCHAR(191) NOT NULL,
    `lastActivity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cache` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CacheLock` (
    `key` VARCHAR(191) NOT NULL,
    `owner` VARCHAR(191) NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `queue` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `reservedAt` INTEGER NULL,
    `availableAt` INTEGER NOT NULL,
    `createdAt` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobBatch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `totalJobs` INTEGER NOT NULL,
    `pendingJobs` INTEGER NOT NULL,
    `failedJobs` INTEGER NOT NULL,
    `failedJobIds` VARCHAR(191) NOT NULL,
    `options` VARCHAR(191) NULL,
    `createdAt` INTEGER NOT NULL,
    `cancelledAt` INTEGER NULL,
    `finishedAt` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FailedJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `connection` VARCHAR(191) NOT NULL,
    `queue` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL,
    `exception` VARCHAR(191) NOT NULL,
    `failedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FailedJob_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Package` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `speed` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `billingPeriod` VARCHAR(191) NULL DEFAULT 'monthly',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `pppoeUsername` VARCHAR(191) NOT NULL,
    `pppoePassword` VARCHAR(191) NOT NULL,
    `packageId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'inactive',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_pppoeUsername_key`(`pppoeUsername`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'unpaid',
    `dueDate` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `periodStart` VARCHAR(191) NULL,
    `periodEnd` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` INTEGER NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Router` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `host` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 8728,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `apiPort` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PppoeAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `routerId` INTEGER NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `profile` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `service` VARCHAR(191) NOT NULL DEFAULT 'pppoe',
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PppoeAccount_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `oldValues` VARCHAR(191) NULL,
    `newValues` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PppoeAccount` ADD CONSTRAINT `PppoeAccount_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PppoeAccount` ADD CONSTRAINT `PppoeAccount_routerId_fkey` FOREIGN KEY (`routerId`) REFERENCES `Router`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
