import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'ADMIN' | 'MOD' | 'USER';
    }
  }

  interface User {
    id: string;
    role?: 'ADMIN' | 'MOD' | 'USER';
    isBanned?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: 'ADMIN' | 'MOD' | 'USER';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) {
          console.log(`[AUTH] Login failed: User not found (${credentials.email})`);
          return null;
        }

        if (!user.password) {
          console.log(`[AUTH] Login failed: No password set for user (${credentials.email})`);
          return null;
        }

        if (user.isBanned) {
          console.log(`[AUTH] Login failed: User is banned (${credentials.email})`);
          throw new Error('Your account has been suspended.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          console.log(`[AUTH] Login failed: Password mismatch for user (${credentials.email})`);
          return null;
        }

        console.log(`[AUTH] Login successful for user: ${user.email}`);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as 'ADMIN' | 'MOD' | 'USER',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
