-- CreateTable
CREATE TABLE "admission_sessions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_timings" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "timing" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "program_timings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_programs" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "program_timing_id" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 0,
    "roll_prefix" TEXT,

    CONSTRAINT "session_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_sessions_name_key" ON "admission_sessions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admission_sessions_year_key" ON "admission_sessions"("year");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "program_timings_program_id_timing_key" ON "program_timings"("program_id", "timing");

-- CreateIndex
CREATE UNIQUE INDEX "session_programs_session_id_program_timing_id_key" ON "session_programs"("session_id", "program_timing_id");

-- AddForeignKey
ALTER TABLE "program_timings" ADD CONSTRAINT "program_timings_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_programs" ADD CONSTRAINT "session_programs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admission_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_programs" ADD CONSTRAINT "session_programs_program_timing_id_fkey" FOREIGN KEY ("program_timing_id") REFERENCES "program_timings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
