# 🤖 @777-project/discord-bot

This module contains the backend system and Discord Bot for the 777 Project.

## ⚙️ Core Features
- **Music System**: Advanced music playback using `discord-player` and raw voice connections, enabling users to play, queue, and manage music in voice channels.
- **Server Tracking (Unturned)**: Pings and tracks real-time data for game servers using `gamedig`, updating statuses automatically.
- **Prisma Database**: Centralized data management for user stats, queues, and configuration.

## 🛠️ Scripts & Usage
Inside this directory (`/bot`), you can run:

- `npm run dev` — Starts the bot in development mode (using `ts-node`).
- `npm run build` — Compiles the TypeScript source code into `/dist`.
- `npm run start` — Runs the compiled JavaScript in production.
- `npm run db:push` — Pushes your local Prisma schema to the database.

## 📂 Structure Highlight
- `/src/commands` - Contains all executable Discord slash commands (e.g., `/play`, `/track`).
- `/src/services` - Core business logic, tracker polling, and database interactions.
- `/src/utils` - Helper functions like logging (`pino`) and custom embeds.
