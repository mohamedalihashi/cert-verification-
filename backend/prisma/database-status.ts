import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const [users, courses, students, studentsWithDatabasePhotos, certificates, activityLogs, settings] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.student.count(),
    prisma.student.count({ where: { photoData: { not: null } } }),
    prisma.certificate.count(),
    prisma.activityLog.count(),
    prisma.settings.count(),
  ]);
  console.log(JSON.stringify({ users, courses, students, studentsWithDatabasePhotos, certificates, activityLogs, settings }));
} finally {
  await prisma.$disconnect();
}
