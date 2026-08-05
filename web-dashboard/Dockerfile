# STAGE 1: Budowanie frontendu (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Instalacja zależności
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Kopiowanie kodu
COPY . .

# Budowanie klienta bazy danych (jeśli front używa własnej, lub do typów)
RUN npx prisma generate

# Budowanie Next.js w trybie standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# STAGE 2: Produkcyjny obraz
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Skopiuj potrzebne pliki z trybu standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Skopiuj folder bazy (wraz z SQLite, jeśli używasz lokalnie na start) - docelowo będzie PostgreSQL
# Przekopiujmy po prostu cały folder prisma z kluczem by serwer mial do niej dostep.
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
