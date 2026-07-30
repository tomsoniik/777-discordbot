# STAGE 1: Budowanie bota (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiowanie zależności
COPY package*.json ./
COPY prisma ./prisma/

# Instalacja WSZYSTKICH pakietów (również devDependencies) do zbudowania TypeScript
# --no-audit --no-fund oszczędza pamięć RAM przy instalacji
RUN npm ci --no-audit --no-fund

# Kopiowanie reszty plików
COPY . .

# Generowanie klienta Prisma i budowa bota
RUN npx prisma generate
RUN npm run build

# Usuwamy paczki deweloperskie by odchudzić node_modules przed przeniesieniem do obrazu produkcyjnego
RUN npm prune --omit=dev


# STAGE 2: Produkcyjny obraz Bota
FROM node:20-alpine

# Instalacja ffmpeg i python (często potrzebny do odtwarzania streamów)
RUN apk add --no-cache ffmpeg python3 make g++ 

WORKDIR /app

# Kopiowanie package.json i wygenerowanej bazy
COPY package*.json ./
COPY prisma ./prisma/

# Zamiast instalować pakiety od nowa i ryzykować Out Of Memory (Exit 137), po prostu kopiujemy gotowe z buildera
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Domyślny port w razie wystawienia API wewn. (opcjonalne)
EXPOSE 8080

# Komenda startowa
CMD ["npm", "start"]
