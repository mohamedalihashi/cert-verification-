import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function portrait(name: string, hue: number) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},42%,32%)"/>
      <stop offset="100%" stop-color="hsl(${hue},40%,16%)"/>
    </linearGradient></defs>
    <rect width="256" height="256" fill="url(#g)"/>
    <circle cx="128" cy="128" r="116" fill="none" stroke="hsla(40,55%,72%,0.4)" stroke-width="3"/>
    <text x="128" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="84" font-weight="600" fill="#f6e7c1">${initials}</text>
  </svg>`;
}

function savePhoto(id: string, name: string, hue: number) {
  const dir = join(process.cwd(), 'uploads', 'photos');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.svg`);
  writeFileSync(path, portrait(name, hue));
  return path;
}

async function main() {
  await prisma.certificate.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();

  const superHash = await bcrypt.hash('SuperAdmin123!', 12);
  const staffHash = await bcrypt.hash('Staff123!', 12);

  await prisma.user.createMany({
    data: [
      {
        id: 'usr_super',
        name: 'Amina Osman',
        email: 'superadmin@cilan.edu',
        role: 'super_admin',
        status: 'active',
        passwordHash: superHash,
        createdAt: new Date('2025-01-08T08:00:00.000Z'),
      },
      {
        id: 'usr_staff',
        name: 'Mohamed Ismail',
        email: 'staff@cilan.edu',
        role: 'staff',
        status: 'active',
        passwordHash: staffHash,
        createdAt: new Date('2025-03-12T09:30:00.000Z'),
      },
    ],
  });

  const courses = [
    { id: 'crs_eng', name: 'English Language', code: 'ENG', department: 'Languages', description: 'General and professional English communication skills.' },
    { id: 'crs_cmp', name: 'Computer Skills', code: 'CMP', department: 'Information Technology', description: 'Office applications, internet, and digital literacy.' },
    { id: 'crs_hlt', name: 'Health Assistant', code: 'HLT', department: 'Health Sciences', description: 'Foundational health support and patient-care skills.' },
    { id: 'crs_lab', name: 'Laboratory Skills', code: 'LAB', department: 'Health Sciences', description: 'Introductory laboratory procedures and safety.' },
    { id: 'crs_acc', name: 'Accounting', code: 'ACC', department: 'Business', description: 'Bookkeeping, financial records, and basic accounting.' },
    { id: 'crs_ofc', name: 'Office Management', code: 'OFC', department: 'Business', description: 'Administration, filing, and office coordination.' },
  ];
  await prisma.course.createMany({
    data: courses.map((c) => ({ ...c, status: 'active', createdAt: new Date('2025-01-10T10:00:00.000Z') })),
  });

  const students = [
    { id: 'stu_ahmed', studentId: 'STU-2025-00012', fullName: 'Ahmed Mohamed Ali', gender: 'male', courseId: 'crs_eng', hue: 192, createdAt: '2025-04-02T09:00:00.000Z' },
    { id: 'stu_amina', studentId: 'STU-2025-00018', fullName: 'Amina Hassan Nur', gender: 'female', courseId: 'crs_acc', hue: 18, createdAt: '2025-05-14T09:00:00.000Z' },
    { id: 'stu_omar', studentId: 'STU-2025-00024', fullName: 'Omar Abdi Yusuf', gender: 'male', courseId: 'crs_cmp', hue: 210, createdAt: '2025-06-01T09:00:00.000Z' },
    { id: 'stu_fatima', studentId: 'STU-2026-00031', fullName: 'Fatima Ali Ibrahim', gender: 'female', courseId: 'crs_hlt', hue: 330, createdAt: '2026-01-18T09:00:00.000Z' },
    { id: 'stu_hassan', studentId: 'STU-2026-00040', fullName: 'Hassan Mohamed Farah', gender: 'male', courseId: 'crs_lab', hue: 150, createdAt: '2026-02-09T09:00:00.000Z' },
    { id: 'stu_khadija', studentId: 'STU-2026-00047', fullName: 'Khadija Osman Ali', gender: 'female', courseId: 'crs_ofc', hue: 40, createdAt: '2026-03-03T09:00:00.000Z' },
    { id: 'stu_yusuf', studentId: 'STU-2026-00055', fullName: 'Yusuf Abdullahi Warsame', gender: 'male', courseId: 'crs_acc', hue: 250, createdAt: '2026-04-16T09:00:00.000Z' },
    { id: 'stu_sahra', studentId: 'STU-2026-00061', fullName: 'Sahra Mohamed Jama', gender: 'female', courseId: 'crs_eng', hue: 300, createdAt: '2026-05-22T09:00:00.000Z' },
  ];

  for (const s of students) {
    await prisma.student.create({
      data: {
        id: s.id,
        studentId: s.studentId,
        fullName: s.fullName,
        gender: s.gender,
        courseId: s.courseId,
        photoPath: savePhoto(s.id, s.fullName, s.hue),
        createdAt: new Date(s.createdAt),
      },
    });
  }

  const certs = [
    { id: 'crt_452', studentId: 'stu_ahmed', certificateNumber: 'CILAN-2026-00452', courseId: 'crs_eng', issueDate: '2026-08-15', graduationYear: 2026, overallResult: 'Excellent', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g1', subject: 'Listening', result: '92%' }, { id: 'g2', subject: 'Speaking', result: '88%' }, { id: 'g3', subject: 'Reading', result: '90%' }, { id: 'g4', subject: 'Writing', result: '85%' }] },
    { id: 'crt_310', studentId: 'stu_ahmed', certificateNumber: 'CILAN-2026-00310', courseId: 'crs_cmp', issueDate: '2026-06-02', graduationYear: 2026, overallResult: 'Very Good', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g5', subject: 'MS Office', result: 'Very Good' }, { id: 'g6', subject: 'Internet Skills', result: 'Excellent' }] },
    { id: 'crt_880', studentId: 'stu_ahmed', certificateNumber: 'CILAN-2025-00880', courseId: 'crs_hlt', issueDate: '2025-12-12', graduationYear: 2025, overallResult: 'Pass', status: 'valid', createdById: 'usr_super', grades: [{ id: 'g7', subject: 'Health Training', result: 'Pass' }] },
    { id: 'crt_401', studentId: 'stu_amina', certificateNumber: 'CILAN-2026-00401', courseId: 'crs_acc', issueDate: '2026-07-20', graduationYear: 2026, overallResult: '85%', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g8', subject: 'Bookkeeping', result: '87%' }, { id: 'g9', subject: 'Financial Records', result: '83%' }] },
    { id: 'crt_198', studentId: 'stu_omar', certificateNumber: 'CILAN-2026-00198', courseId: 'crs_cmp', issueDate: '2026-03-11', graduationYear: 2026, overallResult: 'Excellent', status: 'revoked', createdById: 'usr_staff', grades: [{ id: 'g10', subject: 'Computer Skills', result: 'Excellent' }] },
    { id: 'crt_199', studentId: 'stu_omar', certificateNumber: 'CILAN-2026-00199', courseId: 'crs_cmp', issueDate: '2026-04-02', graduationYear: 2026, overallResult: 'Excellent', status: 'valid', createdById: 'usr_super', grades: [{ id: 'g11', subject: 'Computer Skills', result: 'Excellent' }] },
    { id: 'crt_428', studentId: 'stu_fatima', certificateNumber: 'CILAN-2026-00428', courseId: 'crs_hlt', issueDate: '2026-08-04', graduationYear: 2026, overallResult: 'Very Good', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g12', subject: 'Patient Care', result: 'Very Good' }, { id: 'g13', subject: 'First Aid', result: 'Excellent' }] },
    { id: 'crt_360', studentId: 'stu_hassan', certificateNumber: 'CILAN-2026-00360', courseId: 'crs_lab', issueDate: '2026-06-22', graduationYear: 2026, overallResult: 'Pass', status: 'archived', createdById: 'usr_super', grades: [{ id: 'g14', subject: 'Laboratory Skills', result: 'Pass' }] },
    { id: 'crt_470', studentId: 'stu_khadija', certificateNumber: 'CILAN-2026-00470', courseId: 'crs_ofc', issueDate: '2026-08-21', graduationYear: 2026, overallResult: 'Very Good', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g15', subject: 'Office Management', result: 'Very Good' }] },
    { id: 'crt_441', studentId: 'stu_yusuf', certificateNumber: 'CILAN-2026-00441', courseId: 'crs_acc', issueDate: '2026-08-12', graduationYear: 2026, overallResult: 'Excellent', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g16', subject: 'Accounting', result: 'Excellent' }] },
    { id: 'crt_488', studentId: 'stu_sahra', certificateNumber: 'CILAN-2026-00488', courseId: 'crs_eng', issueDate: '2026-08-28', graduationYear: 2026, overallResult: 'Excellent', status: 'valid', createdById: 'usr_staff', grades: [{ id: 'g17', subject: 'Listening', result: 'Excellent' }, { id: 'g18', subject: 'Speaking', result: 'Very Good' }] },
    { id: 'crt_102', studentId: 'stu_amina', certificateNumber: 'CILAN-2025-00102', courseId: 'crs_ofc', issueDate: '2025-11-03', graduationYear: 2025, overallResult: 'Pass', status: 'replaced', createdById: 'usr_super', grades: [{ id: 'g19', subject: 'Office Management', result: 'Pass' }] },
  ];

  for (const c of certs) {
    await prisma.certificate.create({
      data: {
        id: c.id,
        studentId: c.studentId,
        certificateNumber: c.certificateNumber,
        certificateNumberKey: c.certificateNumber.toLowerCase(),
        courseId: c.courseId,
        issueDate: new Date(c.issueDate),
        graduationYear: c.graduationYear,
        overallResult: c.overallResult,
        grades: c.grades,
        status: c.status,
        notes: '',
        createdById: c.createdById,
        createdAt: new Date(`${c.issueDate}T10:00:00.000Z`),
      },
    });
  }

  await prisma.settings.create({
    data: {
      id: 'default',
      schoolName: 'Horseed Academy Model for Science and Languages',
      schoolShortName: 'Horseed Academy',
      tagline: 'Achievement Through Learning',
      address: '12 Education Avenue, Mogadishu',
      phone: '+252 61 000 0000',
      email: 'verify@cilan.edu',
      website: 'www.cilan.edu',
      publicBaseUrl: '',
      maxCertFileMb: 8,
      maxPhotoMb: 5,
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { id: 'log_1', userId: 'usr_super', userName: 'Amina Osman', action: 'Student created', recordType: 'student', recordId: 'stu_ahmed', ipAddress: '102.23.14.8', createdAt: new Date('2025-04-02T09:00:00.000Z') },
      { id: 'log_2', userId: 'usr_staff', userName: 'Mohamed Ismail', action: 'Certificate created', recordType: 'certificate', recordId: 'crt_452', ipAddress: '102.23.14.21', createdAt: new Date('2026-08-15T11:20:00.000Z') },
      { id: 'log_3', userId: 'usr_super', userName: 'Amina Osman', action: 'Certificate revoked', recordType: 'certificate', recordId: 'crt_198', ipAddress: '102.23.14.8', createdAt: new Date('2026-04-02T08:30:00.000Z') },
    ],
  });

  console.log('Seed complete. Demo logins:');
  console.log('  superadmin@cilan.edu / SuperAdmin123!');
  console.log('  staff@cilan.edu / Staff123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
