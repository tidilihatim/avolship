import NextAuth, { DefaultSession } from 'next-auth';
import { UserRole } from '@/lib/db/models/user'; // Adjust the path as needed

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
  interface User {
    role: UserRole;
  }
}