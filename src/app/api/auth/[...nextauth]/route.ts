import { authOptions } from '@/config/auth';
import NextAuth from 'next-auth';



// Required NextAuth handler for App Router (API route)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
