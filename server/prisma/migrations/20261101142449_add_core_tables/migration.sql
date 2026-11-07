-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "cnic" TEXT,
    "passport" TEXT,
    "name" TEXT NOT NULL,
    "father_name" TEXT,
    "gender" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "is_dummy" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "program_timing_id" INTEGER,
    "form_no" TEXT,
    "roll_no" TEXT,
    "original_roll_no" TEXT,
    "external_student_id" TEXT,
    "degree_title" TEXT,
    "uni_name" TEXT,
    "passing_year" INTEGER,
    "obtained_marks" DECIMAL(10,3),
    "total_marks" DECIMAL(10,3),
    "cgpa" DECIMAL(5,3),
    "extra_data" JSONB,
    "is_dummy" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_evaluations" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "obtained_marks" DOUBLE PRECISION NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "duration_seconds" INTEGER,
    "taken_at" TIMESTAMP(3),
    "result" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_decisions" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decided_by" INTEGER,
    "reason" TEXT,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "admission_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "source_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "stage_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_cnic_key" ON "students"("cnic");

-- CreateIndex
CREATE UNIQUE INDEX "students_passport_key" ON "students"("passport");

-- CreateIndex
CREATE INDEX "applications_session_id_idx" ON "applications"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_session_id_roll_no_key" ON "applications"("session_id", "roll_no");

-- CreateIndex
CREATE UNIQUE INDEX "applications_session_id_student_id_program_timing_id_key" ON "applications"("session_id", "student_id", "program_timing_id");

-- CreateIndex
CREATE INDEX "eligibility_evaluations_application_id_idx" ON "eligibility_evaluations"("application_id");

-- CreateIndex
CREATE INDEX "test_attempts_application_id_idx" ON "test_attempts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_decisions_application_id_key" ON "admission_decisions"("application_id");

-- CreateIndex
CREATE INDEX "import_jobs_session_id_idx" ON "import_jobs"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_session_id_stage_code_key" ON "workflow_stages"("session_id", "stage_code");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_program_timing_id_fkey" FOREIGN KEY ("program_timing_id") REFERENCES "program_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_evaluations" ADD CONSTRAINT "eligibility_evaluations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_decisions" ADD CONSTRAINT "admission_decisions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_decisions" ADD CONSTRAINT "admission_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
