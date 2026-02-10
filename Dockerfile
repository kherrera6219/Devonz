# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Remix app
RUN pnpm run build

# Stage 3: Production runtime
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 devonz && \
    adduser --system --uid 1001 devonz

# Install pnpm for running the app
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Copy only what's needed for production
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER devonz

EXPOSE 3000

CMD ["pnpm", "start"]
