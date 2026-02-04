# syntax=docker/dockerfile:1

# Multi-stage Next.js Dockerfile following official recommendations
# https://nextjs.org/docs/app/building-your-application/deploying#docker-image

# =============================================================================
# Stage 1: Base image with Node.js and pnpm
# =============================================================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# =============================================================================
# Stage 2: Install dependencies
# =============================================================================
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# for understanding why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./

COPY client/package.json ./client/package.json

RUN pnpm install --frozen-lockfile --filter client...

# =============================================================================
# Stage 3: Build the application
# =============================================================================
FROM base AS builder

WORKDIR /app

# Copy workspace configuration
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy dependencies from deps stage (both root and client node_modules)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy root tsconfig.json (extended by client/tsconfig.json)
COPY tsconfig.json ./

# Copy client package.json and source code
COPY client/package.json ./client/package.json
COPY client ./client

# Build-time environment variables (NEXT_PUBLIC_* are embedded in the client bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPBOX_API_TOKEN

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_MAPBOX_API_TOKEN=${NEXT_PUBLIC_MAPBOX_API_TOKEN}

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with standalone output
WORKDIR /app/client
RUN pnpm build

# =============================================================================
# Stage 4: Production runtime
# =============================================================================
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/client/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
