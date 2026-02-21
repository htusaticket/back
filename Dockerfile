# Stage 1: Base Development Image
FROM node:20-alpine AS development
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=5000
ENV NODE_ENV=development
EXPOSE 5000
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Generar el cliente Prisma
RUN npx prisma generate
# Script para migraciones y arranque
CMD ["npm", "run", "start:dev"]

# Stage 2: Install Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --ignore-scripts
RUN npx prisma generate


# Stage 3: Build Application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 4: Production Image
FROM node:20-alpine AS production
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=5000
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
# Agregar script para manejo de migraciones y arranque
COPY scripts/start.sh ./
RUN chmod +x start.sh
USER node
EXPOSE 5000
# Healthcheck para verificar el estado del servicio
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q -O- http://localhost:5000/api/health || exit 1
CMD ["./start.sh"]
