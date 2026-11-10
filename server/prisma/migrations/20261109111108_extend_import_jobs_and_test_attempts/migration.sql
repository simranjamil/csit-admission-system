/*
  Warnings:

  - A unique constraint covering the columns `[application_id]` on the table `test_attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "test_attempts_application_id_idx";

-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "file_hash" TEXT,
ADD COLUMN     "program_id" INTEGER,
ADD COLUMN     "rows_dummy" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rows_duplicate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rows_failed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rows_imported" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "test_attempts" ADD COLUMN     "import_job_id" INTEGER,
ADD COLUMN     "program_id" INTEGER;

-- CreateTable
CREATE TABLE "test_category_scores" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "category_name" TEXT NOT NULL,
    "obtained_marks" DOUBLE PRECISION NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "test_category_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_category_scores_attempt_id_idx" ON "test_category_scores"("attempt_id");

-- CreateIndex
CREATE INDEX "import_jobs_session_id_program_id_file_hash_idx" ON "import_jobs"("session_id", "program_id", "file_hash");

-- CreateIndex
CREATE INDEX "test_attempts_program_id_idx" ON "test_attempts"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_attempts_application_id_key" ON "test_attempts"("application_id");

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_category_scores" ADD CONSTRAINT "test_category_scores_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
