import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const [users, courses, students, certificates, activityLogs, settings] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.student.count(),
    prisma.certificate.count(),
    prisma.activityLog.count(),
    prisma.settings.count(),
  ]);
  console.log(JSON.stringify({ users, courses, students, certificates, activityLogs, settings }));
} finally {
  await prisma.$disconnect();
}
