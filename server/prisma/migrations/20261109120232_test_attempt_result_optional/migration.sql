/*
  Warnings:

  - You are about to drop the column `created_at` on the `test_attempts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "test_attempts" DROP COLUMN "created_at",
ALTER COLUMN "result" DROP NOT NULL;
