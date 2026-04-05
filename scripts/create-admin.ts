import { PrismaClient, GlobalRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Initialize Prisma with database pool adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Creates or updates a SuperAdmin user from the CLI.
 * 
 * Usage:
 * npm run admin:create -- --email=admin@example.com --password=secret --firstName=System --lastName=Admin
 */
async function main() {
  const args = process.argv.slice(2);
  const data: Record<string, string> = {};
  
  args.forEach(arg => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      data[match[1]] = match[2];
    }
  });

  const { email, password, firstName, lastName } = data;

  if (!email || !password) {
    console.error('\x1b[31m❌ Error: --email and --password are required\x1b[0m');
    console.log('Usage: npm run admin:create -- --email=admin@example.com --password=secret [--firstName=System] [--lastName=Admin]');
    process.exit(1);
  }

  // Pre-check if user exists to provide specific logging
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        globalRole: GlobalRole.SUPERADMIN,
      },
      create: {
        email,
        password: hashedPassword,
        firstName: firstName || 'System',
        lastName: lastName || 'Admin',
        globalRole: GlobalRole.SUPERADMIN,
      },
    });

    if (existingUser) {
      console.log(`\x1b[34mℹ️  User already existed. Updated password and ensured SUPERADMIN role for: ${user.email}\x1b[0m`);
    } else {
      console.log(`\x1b[32m✅ Successfully created new SuperAdmin user: ${user.email}\x1b[0m`);
    }
  } catch (error) {
    console.error('\x1b[31m❌ Failed to create/update Admin user:\x1b[0m', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
