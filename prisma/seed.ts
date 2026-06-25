import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // --- Super Admin ---
  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@tegbale.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@1234';

  const adminHash = await bcrypt.hash(adminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminHash, firstName: 'Super', lastName: 'Admin' },
    create: {
      email: adminEmail,
      password: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✓ Super admin:   ${superAdmin.email}  /  ${adminPassword}`);

  // --- Demo School ---
  const school = await prisma.school.upsert({
    where: { email: 'info@laurelnursery.edu' },
    update: {},
    create: {
      name: 'Laurel Nursery & Primary School',
      email: 'info@laurelnursery.edu',
      phone: '+2348012345678',
      address: '12 Balogun Street, Lagos',
    },
  });
  console.log(`✓ Demo school:   ${school.name} (id: ${school.id})`);

  // --- School Admin ---
  const schoolAdminEmail = process.env.SCHOOL_ADMIN_EMAIL ?? 'admin@laurelnursery.edu';
  const schoolAdminPassword = process.env.SCHOOL_ADMIN_PASSWORD ?? 'School@1234';

  const schoolAdminHash = await bcrypt.hash(schoolAdminPassword, 12);

  const schoolAdmin = await prisma.user.upsert({
    where: { email: schoolAdminEmail },
    update: { password: schoolAdminHash, schoolId: school.id },
    create: {
      email: schoolAdminEmail,
      password: schoolAdminHash,
      firstName: 'Jane',
      lastName: 'Okafor',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });
  console.log(`✓ School admin:  ${schoolAdmin.email}  /  ${schoolAdminPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
