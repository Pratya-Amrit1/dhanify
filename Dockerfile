# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Prisma + Node need OpenSSL
RUN apk add --no-cache openssl libc6-compat

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Skip Prisma auto-generate during install
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client explicitly
RUN pnpm prisma generate

# Build args (public only)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL

# Build Next.js standalone (ensure public envs exist for SSG)
RUN set -euo pipefail \
	 && BUILD_CLERK_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" \
	 && BUILD_APP_URL="${NEXT_PUBLIC_APP_URL:-}" \
	 && if [ -z "$BUILD_CLERK_KEY" ] && [ -f ".env.production" ]; then \
			BUILD_CLERK_KEY=$(awk -F= '$1=="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" {print $2}' .env.production | tr -d '\r'); \
		 fi \
	 && if [ -z "$BUILD_APP_URL" ] && [ -f ".env.production" ]; then \
			BUILD_APP_URL=$(awk -F= '$1=="NEXT_PUBLIC_APP_URL" {print $2}' .env.production | tr -d '\r'); \
		 fi \
	 && if [ -z "$BUILD_CLERK_KEY" ]; then \
			echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be provided via --build-arg or .env.production"; \
			exit 1; \
		 fi \
	 && if [ -z "$BUILD_APP_URL" ]; then \
			echo "NEXT_PUBLIC_APP_URL must be provided via --build-arg or .env.production"; \
			exit 1; \
		 fi \
	 && NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$BUILD_CLERK_KEY" \
		 NEXT_PUBLIC_APP_URL="$BUILD_APP_URL" \
		 pnpm build

# Remove dev deps
RUN pnpm prune --prod


# ------------------------
# Stage 2: Runner
# ------------------------
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only what is needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
