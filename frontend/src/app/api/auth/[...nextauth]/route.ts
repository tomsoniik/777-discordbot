import NextAuth, { NextAuthOptions } from "next-auth"
import SteamProvider from "next-auth-steam"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export function getAuthOptions(req?: Request): NextAuthOptions {
  let origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    if (host) {
      origin = `${protocol}://${host}`;
    }
  }

  const requestForSteam = req || new Request(`${origin}/api/auth`);

  return {
    session: {
      strategy: "jwt",
    },
    providers: [
      SteamProvider(requestForSteam, {
        clientSecret: process.env.STEAM_API_KEY || "5764EDE15ADAFAEC248568A1F11B59CE",
        callbackUrl: `${origin}/api/auth/callback`,
      }),
    ],
    callbacks: {
      async signIn({ user, profile }) {
        try {
          const p = profile as any;
          const steamId = String(p?.steamid || user?.id || "");
          if (steamId) {
            const name = p?.personaname || user?.name || "Gracz Steam";
            const image = p?.avatarfull || p?.avatarmedium || user?.image || "";
            const email = user?.email || `${steamId}@steamcommunity.com`;

            const existing = await prisma.user.findFirst({
              where: {
                OR: [
                  { steamId: steamId },
                  { id: user.id }
                ]
              }
            });

            if (existing) {
              await prisma.user.update({
                where: { id: existing.id },
                data: { steamId, name, image }
              });
            } else {
              await prisma.user.create({
                data: {
                  id: user.id || steamId,
                  steamId,
                  name,
                  image,
                  email
                }
              });
            }
          }
        } catch (e) {
          console.error("Steam signin database sync error (non-fatal):", e);
        }
        return true;
      },
      async jwt({ token, profile, user }) {
        if (profile) {
          const p = profile as any;
          token.steamId = p?.steamid || token.sub;
        }
        if (user) {
          // Fetch role from DB on sign in
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser) {
            token.role = dbUser.role;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.sub || token.steamId;
          (session.user as any).steamId = token.steamId;
          (session.user as any).role = token.role || "USER";
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
