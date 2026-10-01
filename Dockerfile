# =====================================================
# Stage 1: build
# =====================================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# =====================================================
# Stage 2: production dependencies only
# =====================================================
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# =====================================================
# Stage 3: runner
# =====================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    DATA_DIR=/data \
    TRUST_PROXY=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Everything edited in the admin lives in /data: content.json, history/, uploads/,
# enquiries.json. A named volume MUST be mounted here or it is lost on every deploy.
RUN apk add --no-cache su-exec && mkdir /data && chown node:node /data
VOLUME /data

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4321

# /api/health also fails when /data is not writable
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server/entry.mjs"]
