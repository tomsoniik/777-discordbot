import NextAuth, { NextAuthOptions } from "next-auth"
import SteamProvider from "next-auth-steam"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export function getAuthOptions(req?: Request): NextAuthOptions {
  let origin = process.env.NEXTAUTH_URL;
  if (!origin && process.env.VERCEL_URL) {
    origin = `https://${process.env.VERCEL_URL}`;
  }
  if (!origin) {
    origin = "http://localhost:3000";
  }

  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    if (host) {
      origin = `${protocol}://${host}`;
    }
  }

  const requestForSteam = req || new Request(`${origin}/api/auth`);

  const providers: any[] = [
    SteamProvider(requestForSteam, {
      clientSecret: process.env.STEAM_API_KEY || "5764EDE15ADAFAEC248568A1F11B59CE",
      callbackUrl: `${origin}/api/auth/callback/steam`,
    }),
  ];

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      })
    );
  } else {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID || "1234567890",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "fallback_secret",
      })
    );
  }

  return {
    session: {
      strategy: "jwt",
    },
    providers,
    callbacks: {
      async signIn({ user, account, profile }) {
        try {
          const p = profile as any;
          const steamId = String(p?.steamid || (account?.provider === 'steam' ? user?.id : '') || "");
          const discordId = account?.provider === 'discord' ? (user?.id || p?.id) : undefined;
          
          const name = p?.personaname || user?.name || "Gracz";
          const image = p?.avatarfull || p?.avatarmedium || user?.image || "";
          const email = user?.email || (steamId ? `${steamId}@steamcommunity.com` : (discordId ? `${discordId}@discord.com` : undefined));

          const searchOr: any[] = [];
          if (steamId) searchOr.push({ steamId });
          if (discordId) searchOr.push({ discordId });
          if (user?.id) searchOr.push({ id: user.id });

          const existing = searchOr.length > 0 ? await prisma.user.findFirst({
            where: { OR: searchOr }
          }) : null;

          if (existing) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                ...(steamId ? { steamId } : {}),
                ...(discordId ? { discordId } : {}),
                name: name || existing.name,
                image: image || existing.image
              }
            });
          } else {
            await prisma.user.create({
              data: {
                id: user.id || steamId || discordId || undefined,
                ...(steamId ? { steamId } : {}),
                ...(discordId ? { discordId } : {}),
                name,
                image,
                email
              }
            });
          }
        } catch (e) {
          console.error("Sign in database sync error (non-fatal):", e);
        }
        return true;
      },
      async jwt({ token, profile, account, user }) {
        if (profile) {
          const p = profile as any;
          if (account?.provider === 'steam') {
            token.steamId = p?.steamid || token.sub;
          }
          if (account?.provider === 'discord') {
            token.discordId = p?.id || user?.id;
          }
        }
        if (user || token.sub) {
          try {
            const dbUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { id: user?.id || token.sub },
                  ...(token.steamId ? [{ steamId: token.steamId as string }] : [])
                ]
              }
            });
            if (dbUser) {
              token.role = dbUser.role;
            }
          } catch (e) {}
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.sub || token.steamId;
          (session.user as any).steamId = token.steamId;
          (session.user as any).discordId = token.discordId;
          (session.user as any).role = token.role || "USER";
        }
        return session;
      }
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only_change_me",
  };
}

export const authOptions: NextAuthOptions = getAuthOptions();

export async function GET(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  return NextAuth(req, { params }, getAuthOptions(req));
}

export async function POST(req: NextRequest, context: any) {
  const params = context?.params ? await context.params : undefined;
  return NextAuth(req, { params }, getAuthOptions(req));
}


