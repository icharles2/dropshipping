import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compareSync } from "bcrypt-ts-edge";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/db/prisma";
import type { NextAuthConfig } from "next-auth";

export const config = {
    pages: {
        signIn: "/sign-in",
        error: "/sign-in",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            credentials: {
                email: { type: "email" },
                password: { type: "password" },
            },
            async authorize(credentials) {
                if (credentials === null) return null;

                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string,
                    },
                });

                if (user && user.password) {
                    const isMatch = compareSync(
                        credentials.password as string,
                        user.password,
                    );

                    if (isMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        };
                    }
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, user, trigger, token }: any) {
            // set the user id from the token
            session.user.id = token.sub;
            // if there is an update, set the user name
            if (trigger === "update") {
                session.user.name = user.name;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
