import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongoose';
import User, { UserRole } from '@/lib/db/models/user';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt', // ✅ Use JWT session strategy
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Add these to prevent session fetch errors
  useSecureCookies: process.env.NODE_ENV === 'production',
  trustHost: true,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('No user found with that email');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // ✅ Return full user object for JWT creation
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          image: user.image ?? null, // required by NextAuth
        };
      },
    }),
  ],

  callbacks: {
    // ✅ Save user info into JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    // ✅ Add token info to session
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
        };
      }
      return session;
    },
  },
  
  events: {
    async signOut() {
      // This will be called when signOut is triggered
      console.log('User signed out');
    },
  },

  pages: {
    signIn: '/auth/login', // Your custom login page
    signOut: '/auth/login?logout=true', // Redirect here after logout with logout param
    error: '/auth/error', // Error page
  },

  debug: process.env.NODE_ENV === 'development',
  
  // Add a secret for production
  secret: process.env.NEXTAUTH_SECRET || 'your-super-secret-key-change-this-in-production',
  
  // Cookie settings
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};