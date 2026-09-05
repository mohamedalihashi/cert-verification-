-- Horseed Academy Certificate Registry
-- Run this in Supabase: SQL Editor → New query → Run
-- Demo logins after this script:
--   superadmin@cilan.edu / SuperAdmin123!
--   staff@cilan.edu / Staff123!

BEGIN;

DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

DROP TYPE IF EXISTS "CertificateStatus";
DROP TYPE IF EXISTS "Gender";
DROP TYPE IF EXISTS "CourseStatus";
DROP TYPE IF EXISTS "UserStatus";
DROP TYPE IF EXISTS "UserRole";

CREATE TYPE "UserRole" AS ENUM ('super_admin', 'staff');
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "CourseStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');
CREATE TYPE "CertificateStatus" AS ENUM ('valid', 'revoked', 'replaced', 'archived');

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  role            "UserRole" NOT NULL DEFAULT 'staff',
  status          "UserStatus" NOT NULL DEFAULT 'active',
  "passwordHash"  TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courses (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  department    TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  status        "CourseStatus" NOT NULL DEFAULT 'active',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id            TEXT PRIMARY KEY,
  "studentId"   TEXT NOT NULL UNIQUE,
  "fullName"    TEXT NOT NULL,
  "photoPath"   TEXT,
  gender        "Gender" NOT NULL,
  "courseId"    TEXT NOT NULL REFERENCES courses(id),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX students_courseId_idx ON students ("courseId");

CREATE TABLE certificates (
  id                      TEXT PRIMARY KEY,
  "studentId"             TEXT NOT NULL REFERENCES students(id),
  "certificateNumber"     TEXT NOT NULL,
  "certificateNumberKey"  TEXT NOT NULL UNIQUE,
  "courseId"              TEXT NOT NULL REFERENCES courses(id),
  "issueDate"             DATE NOT NULL,
  "graduationYear"        INTEGER NOT NULL,
  "overallResult"         TEXT NOT NULL DEFAULT '',
  grades                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "fileName"              TEXT,
  "fileMimeType"          TEXT,
  "fileSize"              INTEGER,
  "filePath"              TEXT,
  status                  "CertificateStatus" NOT NULL DEFAULT 'valid',
  notes                   TEXT NOT NULL DEFAULT '',
  "createdById"           TEXT NOT NULL REFERENCES users(id),
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX certificates_studentId_idx ON certificates ("studentId");
CREATE INDEX certificates_courseId_idx ON certificates ("courseId");
CREATE INDEX certificates_status_idx ON certificates (status);
CREATE INDEX certificates_graduationYear_idx ON certificates ("graduationYear");
CREATE INDEX certificates_issueDate_idx ON certificates ("issueDate");

CREATE TABLE activity_logs (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES users(id),
  "userName"    TEXT NOT NULL,
  action        TEXT NOT NULL,
  "recordType"  TEXT NOT NULL,
  "recordId"    TEXT NOT NULL,
  "ipAddress"   TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_logs_createdAt_idx ON activity_logs ("createdAt");
CREATE INDEX activity_logs_recordType_idx ON activity_logs ("recordType");

CREATE TABLE settings (
  id                TEXT PRIMARY KEY DEFAULT 'default',
  "schoolName"      TEXT NOT NULL,
  "schoolShortName" TEXT NOT NULL,
  tagline           TEXT NOT NULL,
  address           TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT NOT NULL,
  website           TEXT NOT NULL,
  "publicBaseUrl"   TEXT NOT NULL DEFAULT '',
  "maxCertFileMb"   INTEGER NOT NULL DEFAULT 8,
  "maxPhotoMb"      INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE password_resets (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX password_resets_userId_idx ON password_resets ("userId");

INSERT INTO users (id, name, email, role, status, "passwordHash", "createdAt") VALUES
  (
    'usr_super',
    'Amina Osman',
    'superadmin@cilan.edu',
    'super_admin',
    'active',
    '$2b$12$gmQubS0oxBE6W8fM7m.6KO.Nfl6fWcOMDOgkPNX500np2aaSEEWSO',
    '2025-01-08T08:00:00.000Z'
  ),
  (
    'usr_staff',
    'Mohamed Ismail',
    'staff@cilan.edu',
    'staff',
    'active',
    '$2b$12$a8UmXs4UxvaXdEtPNIHbIeqhsKFqoX2/qFmTVanT9bfNeNXWnc9MS',
    '2025-03-12T09:30:00.000Z'
  );

INSERT INTO settings (
  id, "schoolName", "schoolShortName", tagline, address, phone, email, website
) VALUES (
  'default',
  'Horseed Academy Model for Science and Languages',
  'Horseed Academy',
  'Achievement Through Learning',
  '12 Education Avenue, Mogadishu',
  '+252 61 000 0000',
  'verify@cilan.edu',
  'www.cilan.edu'
);

COMMIT;
