# STAGE 1: Budowanie bota (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiowanie zależności
COPY package*.json ./
COPY prisma ./prisma/

# Instalacja WSZYSTKICH pakietów (również devDependencies) do zbudowania TypeScript
RUN npm ci

# Kopiowanie reszty plików
COPY . .

# Generowanie klienta Prisma i budowa bota
RUN npx prisma generate
RUN npm run build


# STAGE 2: Produkcyjny obraz Bota
FROM node:20-alpine

# Instalacja ffmpeg i python (często potrzebny do odtwarzania streamów)
RUN apk add --no-cache ffmpeg python3 make g++ 

WORKDIR /app

# Kopiowanie zależności z poprzedniego etapu (by zainstalować tylko produkcyjne)
COPY package*.json ./
COPY prisma ./prisma/

# Instalacja pakietów produkcyjnych (bez devDependencies)
RUN npm ci --omit=dev

# Generowanie klienta Prisma dla środowiska produkcyjnego
RUN npx prisma generate

# Kopiowanie zbudowanych plików z etapu builder
COPY --from=builder /app/dist ./dist

# Domyślny port w razie wystawienia API wewn. (opcjonalne)
EXPOSE 8080

# Komenda startowa
CMD ["npm", "start"]
