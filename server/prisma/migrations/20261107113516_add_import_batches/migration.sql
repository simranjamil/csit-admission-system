-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "import_batch_id" INTEGER;

-- CreateTable
CREATE TABLE "import_batches" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "batch_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rows_total" INTEGER NOT NULL,
    "rows_imported" INTEGER NOT NULL,
    "rows_duplicate" INTEGER NOT NULL,
    "rows_failed" INTEGER NOT NULL,
    "imported_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_batches_session_id_file_hash_idx" ON "import_batches"("session_id", "file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "import_batches_session_id_batch_name_key" ON "import_batches"("session_id", "batch_name");

-- CreateIndex
CREATE INDEX "applications_import_batch_id_idx" ON "applications"("import_batch_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
