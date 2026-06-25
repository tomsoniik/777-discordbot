import NextAuth, { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import SteamProvider from "next-auth-steam"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

function getAuthOptions(req?: NextRequest): NextAuthOptions {
  return {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        authorization: { params: { scope: 'identify email' } },
        profile(profile) {
          if (profile.avatar === null) {
            const defaultAvatarNumber = parseInt(profile.discriminator || "0") % 5
            profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
          } else {
            const format = profile.avatar.startsWith("a_") ? "gif" : "png"
            profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
          }

          return {
            id: profile.id,
            name: profile.username,
            email: profile.email,
            image: profile.image_url,
            discordId: profile.id,
          }
        },
      }),
      SteamProvider(req!, {
        clientSecret: process.env.STEAM_SECRET!,
        callbackUrl: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/steam` : 'http://localhost:3000/api/auth/callback/steam'
      })
    ],
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          // @ts-ignore
          session.user.id = user.id;
        }
        return session;
      }
    }
  }
}

async function handler(req: NextRequest, ctx: any) {
  return NextAuth(req, ctx, getAuthOptions(req))
}

export { handler as GET, handler as POST }
