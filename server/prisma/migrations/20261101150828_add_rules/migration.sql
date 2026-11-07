-- AlterTable
ALTER TABLE "eligibility_evaluations" ADD COLUMN     "rule_version_id" INTEGER;

-- AlterTable
ALTER TABLE "test_attempts" ADD COLUMN     "rule_version_id" INTEGER;

-- CreateTable
CREATE TABLE "rules" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "rule_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_versions" (
    "id" SERIAL NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "reason" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" INTEGER,

    CONSTRAINT "rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_session_id_rule_key_key" ON "rules"("session_id", "rule_key");

-- CreateIndex
CREATE UNIQUE INDEX "rule_versions_rule_id_version_key" ON "rule_versions"("rule_id", "version");

-- CreateIndex
CREATE INDEX "eligibility_evaluations_rule_version_id_idx" ON "eligibility_evaluations"("rule_version_id");

-- CreateIndex
CREATE INDEX "test_attempts_rule_version_id_idx" ON "test_attempts"("rule_version_id");

-- AddForeignKey
ALTER TABLE "eligibility_evaluations" ADD CONSTRAINT "eligibility_evaluations_rule_version_id_fkey" FOREIGN KEY ("rule_version_id") REFERENCES "rule_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_rule_version_id_fkey" FOREIGN KEY ("rule_version_id") REFERENCES "rule_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
