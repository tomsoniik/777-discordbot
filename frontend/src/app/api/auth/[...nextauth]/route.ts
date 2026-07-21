import NextAuth, { NextAuthOptions } from "next-auth"
import SteamProvider from "next-auth-steam"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export function getAuthOptions(req?: Request): NextAuthOptions {
  const dummyReq = req || new Request(process.env.NEXTAUTH_URL || "http://localhost:3000");
  const host = req?.headers.get("host") || "localhost:3000";
  const protocol = req?.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
      SteamProvider(dummyReq, {
        clientSecret: process.env.STEAM_API_KEY || "5764EDE15ADAFAEC248568A1F11B59CE",
        callbackUrl: `${origin}/api/auth/callback/steam`,
      }),
    ],
    callbacks: {
      async signIn({ user, profile }) {
        if (user && user.id) {
          try {
            const p = profile as any;
            const steamId = p?.steamid || p?.id || user?.id;
            const name = p?.personaname || user?.name || "Gracz Steam";
            const image = p?.avatarfull || p?.avatarmedium || user?.image;
            await prisma.user.update({
              where: { id: user.id },
              data: { steamId: String(steamId), name, image }
            });
          } catch (e) {
            console.error("Failed to sync Steam user data:", e);
          }
        }
        return true;
      },
      async session({ session, user }) {
        if (session.user) {
          (session.user as any).id = user?.id;
          (session.user as any).role = (user as any)?.role;
          (session.user as any).steamId = (user as any)?.steamId;
        }
        return session;
      }
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only_change_me",
  };
}

export const authOptions: NextAuthOptions = getAuthOptions();

export async function GET(req: NextRequest, ctx: any) {
  return NextAuth(req, ctx, getAuthOptions(req));
}

export async function POST(req: NextRequest, ctx: any) {
  return NextAuth(req, ctx, getAuthOptions(req));
}
