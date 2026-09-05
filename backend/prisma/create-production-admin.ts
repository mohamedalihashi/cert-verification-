import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const email = (process.argv[2] ?? '').trim().toLowerCase();
const name = (process.argv[3] ?? 'Maxamed Cali Xashi').trim();

if (!email || !email.includes('@')) {
  throw new Error('Usage: npx tsx prisma/create-production-admin.ts EMAIL [NAME]');
}

const temporaryPassword = `${randomBytes(12).toString('base64url')}!Aa7`;
const passwordHash = await bcrypt.hash(temporaryPassword, 12);

try {
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { email } });
    const formerDemoAdmin = await tx.user.findUnique({
      where: { email: 'superadmin@cilan.edu' },
    });

    if (target) {
      await tx.user.update({
        where: { id: target.id },
        data: { name, role: 'super_admin', status: 'active', passwordHash },
      });
    } else if (formerDemoAdmin) {
      await tx.user.update({
        where: { id: formerDemoAdmin.id },
        data: { name, email, role: 'super_admin', status: 'active', passwordHash },
      });
    } else {
      await tx.user.create({
        data: { name, email, role: 'super_admin', status: 'active', passwordHash },
      });
    }

    const knownDemoStaff = await tx.user.findUnique({ where: { email: 'staff@cilan.edu' } });
    if (knownDemoStaff) {
      await tx.user.update({
        where: { id: knownDemoStaff.id },
        data: {
          status: 'disabled',
          passwordHash: await bcrypt.hash(randomBytes(32).toString('base64url'), 12),
        },
      });
    }
  });

  console.log(`Production super administrator: ${email}`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log('Sign in and change this password immediately.');
} finally {
  await prisma.$disconnect();
}
