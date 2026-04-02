import { pgTable, serial, text, timestamp, real, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  image: text('image'),
  role: text('role', { enum: ['ADMIN', 'MOD', 'USER'] }).default('USER').notNull(),
  isBanned: integer('is_banned').default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const incomes = pgTable('incomes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  source: text('source').notNull(),
  amount: real('amount').notNull(),
  category: text('category'),
  description: text('description'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const recurrings = pgTable('recurrings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});
