import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hustletrack';

// Standalone connection for seed
const client = postgres(connectionString, { max: 5 });
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('🧹 Clearing existing data (sessions, accounts, recurrings, goals, incomes, users)...');
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.recurrings);
  await db.delete(schema.goals);
  await db.delete(schema.incomes);
  await db.delete(schema.users);
  
  console.log('👤 Creating initial users...');
  
  const adminPassword = await bcrypt.hash('Dev1234', 12);
  const modPassword = await bcrypt.hash('Dev1234', 12);
  const userPassword = await bcrypt.hash('Dev1234', 12);
  
  const [admin] = await db.insert(schema.users).values({
    name: 'Purple Unlocker',
    email: 'admin@purpleunlocker.site',
    password: adminPassword,
    role: 'ADMIN',
  }).returning();

  const [mod] = await db.insert(schema.users).values({
    name: 'Moderator Pro',
    email: 'mod@purpleunlocker.site',
    password: modPassword,
    role: 'MOD',
  }).returning();

  const [user] = await db.insert(schema.users).values({
    name: 'Normal Hustler',
    email: 'user@purpleunlocker.site',
    password: userPassword,
    role: 'USER',
  }).returning();

  console.log('💸 Generating dummy financial data for normal user...');

  // Inject some dummy incomes and goals for the normal user
  await db.insert(schema.incomes).values([
    {
      userId: user.id,
      source: 'Freelance Design',
      amount: 1500,
      category: 'Design',
      description: 'Monthly retainer for Startup X',
      date: new Date(),
    },
    {
      userId: user.id,
      source: 'E-commerce Store',
      amount: 450,
      category: 'Sales',
      description: 'Etsy prints',
      date: new Date(),
    }
  ]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  await db.insert(schema.goals).values({
    userId: user.id,
    title: 'Monthly Hustle Goal',
    targetAmount: 3000,
    currentAmount: 1950,
    month: currentMonth,
    year: currentYear,
  });

  await db.insert(schema.recurrings).values({
    userId: user.id,
    name: 'Patreon Subs',
    amount: 150,
    category: 'Subscriptions',
    isActive: 1,
  });

  console.log('✅ Seeding completed! Database is ready with Admin, Mod, and Normal User.');
  
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error during database seeding:');
  console.error(err);
  process.exit(1);
});
