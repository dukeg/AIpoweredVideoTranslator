# ── Stage 1: Build React frontend ──────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm install --workspace=client
COPY client/ ./client/
RUN npm run build --workspace=client

# ── Stage 2: Production server ──────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy server deps
COPY server/package.json ./server/
RUN cd server && npm install --production

# Copy server source
COPY server/ ./server/

# Copy built frontend
COPY --from=builder /app/client/dist ./client/dist

# Create dirs
RUN mkdir -p public/uploads public/outputs public/temp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
