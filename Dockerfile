FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 DATA_DIR=/data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# content.json, uploads/, history/ and enquiries.json live here: mount a persistent volume
RUN mkdir /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
