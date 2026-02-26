# ===============================
# Stage 1: Dependencies
# ===============================

FROM node:20.17.0-alpine3.19 AS deps

LABEL maintainer="vinayak@inops.tech"
LABEL description="INops Challan Application"
LABEL version="1.0"

WORKDIR /app

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy package files from ai app directory
COPY apps/challan/package.json apps/challan/package-lock.json ./

# Install dependencies
RUN npm install --prefer-offline --no-audit


# ===============================
# Stage 2: Builder
# ===============================

FROM node:20.17.0-alpine3.19 AS builder
WORKDIR /app

ENV NODE_ENV=production

ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy application source from challan directory
COPY apps/challan/ ./

# ===============================
# Build-time environment variables
# ===============================
ARG GEMINI_API_KEY=PLACEHOLDER_API_KEY
ARG NEXT_PUBLIC_NEXTAUTH_URL

ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}

# Build the Vite application
RUN npm run build


# ===============================
# Stage 3: Runner
# ===============================

FROM node:20.17.0-alpine3.19 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3012

# Runtime-only secrets
ARG GEMINI_API_KEY=PLACEHOLDER_API_KEY
ARG NEXT_PUBLIC_NEXTAUTH_URL

ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy production build from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/vite.config.ts ./vite.config.ts

USER nextjs

EXPOSE 3012

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3012 || exit 1

CMD ["npm", "run", "preview", "--", "--port", "3012", "--host", "0.0.0.0"]

