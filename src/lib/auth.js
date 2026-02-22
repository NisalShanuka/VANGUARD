import DiscordProvider from "next-auth/providers/discord";
import { createOrUpdateUser, getUserByDiscordId } from "@/lib/db";

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: { params: { scope: 'identify email' } },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === "discord") {
                try {
                    await createOrUpdateUser({
                        id: profile.id,
                        username: profile.username,
                        discriminator: profile.discriminator,
                        avatar: profile.image_url || profile.avatar
                    });
                } catch (error) {
                    console.error("Error in signIn callback (createOrUpdateUser):", error);
                    // We still return true to allow the user to sign in, 
                    // unless we want to block them on DB failure.
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                const dbUser = await getUserByDiscordId(token.sub);
                if (dbUser) {
                    session.user.id = dbUser.id;
                    session.user.discord_id = dbUser.discord_id;
                    session.user.role = dbUser.role;
                } else {
                    session.user.id = token.sub;
                }
            }
            return session;
        },
        async jwt({ token, user, profile }) {
            if (profile) {
                token.sub = profile.id;
            }
            return token;
        }
    },
    // pages: {
    //     error: '/api/auth/error',
    // }
};
