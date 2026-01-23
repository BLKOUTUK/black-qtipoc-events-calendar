# BLKOUT Events Calendar - Full-stack Express + React deployment
# Includes backend API routes for event moderation and submission

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy source (including api/ directory)
COPY . .

# Build the Vite frontend
RUN npm run build

# Production stage - Node.js to run Express server
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server and API routes
COPY server.ts ./
COPY api ./api
COPY tsconfig.json tsconfig.node.json ./

# Install tsx to run TypeScript server
RUN npm install -g tsx

# Expose port (server.ts uses PORT env var or 3000)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start Express server (serves frontend + API routes)
CMD ["tsx", "server.ts"]
