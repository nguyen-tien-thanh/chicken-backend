/*
  Warnings:

  - You are about to drop the column `created_by` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `permissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RolePermission" DROP COLUMN "created_by";

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "created_by";
