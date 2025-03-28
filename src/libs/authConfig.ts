import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password", placeholder: "********" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }
                
                await connectDB();
                
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
                    id: (token.user as any).id,
                    email: (token.user as any).email,
                    fullname: (token.user as any).fullname,
                    isAdmin: (token.user as any).isAdmin,
                    role: (token.user as any).role,
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