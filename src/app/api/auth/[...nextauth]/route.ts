import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"
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
    } & DefaultSession["user"]
  }
}

// Ensure admin exists when the auth system initializes
ensureAdminExists();

const handler = NextAuth({
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
                    isAdmin: userFound.isAdmin
                };
            },
        }),
    ],
    callbacks: {
        jwt({ account, token, user, profile, session }) {
            console.log("user: ", user);
            if (user) {
                token.user = {
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname,
                    isAdmin: user.isAdmin
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
                    name: null,
                    image: null
                };
            }
            console.log("session callback: ", session);
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
});

export { handler as GET, handler as POST };