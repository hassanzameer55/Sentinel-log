# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install dependencies (including dev for building if needed, though mostly production here)
RUN npm install --workspace=backend

# Copy source
COPY backend ./backend

# Final Production Stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=backend"]
