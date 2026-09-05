import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function mimeType(path: string) {
  const extension = extname(path).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

try {
  const students = await prisma.student.findMany({
    where: { photoPath: { not: null } },
    select: { id: true, photoPath: true },
  });
  let migrated = 0;
  let missing = 0;
  for (const student of students) {
    if (!student.photoPath) continue;
    try {
      const photoData = await readFile(student.photoPath);
      await prisma.student.update({
        where: { id: student.id },
        data: {
          photoData,
          photoMimeType: mimeType(student.photoPath),
          photoPath: null,
        },
      });
      migrated += 1;
    } catch {
      missing += 1;
    }
  }
  console.log(JSON.stringify({ candidates: students.length, migrated, missing }));
} finally {
  await prisma.$disconnect();
}
