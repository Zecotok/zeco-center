import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { ensureAdminExists } from "@/libs/adminSetup";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      fullname: string;
      isAdmin: boolean;
      role: string;
    } & DefaultSession["user"]
  }
  
  interface User {
    role?: string;
  }
}

// Ensure admin exists when the auth system initializes
ensureAdminExists();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password", placeholder: "********" }
      },
      async authorize(credentials, req) {
        await connectDB();
        if(!credentials) throw new Error('missing credentials!');
        const userFound = await User.findOne({ email: credentials.email }).select("+password");
        if (!userFound) throw new Error("Invalid credentials");

        const passwordMatch = await bcrypt.compare(credentials.password, userFound.password);
        if (!passwordMatch) throw new Error("Invalid credentials");

        return {
          id: userFound._id,
          email: userFound.email,
          fullname: userFound.fullname,
          isAdmin: userFound.isAdmin,
          role: userFound.role || (userFound.isAdmin ? 'ADMIN' : 'USER')
        };
      },
    }),
  ],
  callbacks: {
    jwt({ account, token, user, profile, session }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          isAdmin: user.isAdmin,
          role: user.role
        };
      }
      return token;
    },
    session({ session, token }) {
      if (token.user) {
        session.user = {
          id: (token.user as any).id as string,
          email: (token.user as any).email as string,
          fullname: (token.user as any).fullname as string,
          isAdmin: (token.user as any).isAdmin as boolean,
          role: (token.user as any).role as string,
          name: null,
          image: null
        };
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
}; 