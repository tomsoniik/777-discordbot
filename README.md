# 🌌 777 Project: The Ultimate Monorepo

Welcome to the **777 Project** repository! This monorepo houses the entire ecosystem for the 777 platform, which connects Discord, gaming mechanics (Unturned), and an advanced web interface.

## 🏗️ Architecture Overview

The system is split into two primary modules:

### 1. `@777-project/discord-bot` (Located in `/discord-bot`)
The backend engine and Discord interface of our system. 
- **Role**: Handles Discord slash commands, voice channel connections, complex music playing (via `discord-player` / `ffmpeg`), and game server tracking (e.g. Unturned game servers).
- **Tech Stack**: TypeScript, Node.js, Discord.js v14, Prisma ORM.
- **Learn More**: [Read the Bot Documentation](./discord-bot/README.md)

### 2. `@777-project/web-dashboard` (Located in `/web-dashboard`)
The highly interactive, Next.js powered web platform.
- **Role**: Serves as the landing page, user dashboard, admin panel, and an advanced 3D structural builder (Holographic 3D Engine).
- **Tech Stack**: Next.js 16 (App Router), React 19, Three.js / React Three Fiber (for 3D rendering), NextAuth (for Steam/Discord login), Framer Motion (for physics-based animations).
- **Aesthetic**: Follows the strict **Awesome Antigravity UI/UX** guidelines (Zero Gravity, Glassmorphism 2.0).
- **Learn More**: [Read the Frontend Documentation](./web-dashboard/README.md)

## 🚀 Getting Started (Global)

Since this is a full-stack monorepo, both services share the same database and environment schema via Prisma (configured inside their respective environments).

To run the full stack locally:
1. Set up `.env` files in both `/discord-bot` and `/web-dashboard`.
2. Push your database schema: `npm run db:push` in `/discord-bot` or `/web-dashboard`.
3. In one terminal, navigate to `/discord-bot` and run `npm run dev`.
4. In another terminal, navigate to `/web-dashboard` and run `npm run dev`.

*(Alternatively, use `ecosystem.config.js` via PM2 to run production builds).*
