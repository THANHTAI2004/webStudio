FROM node:22-bookworm-slim AS deps

WORKDIR /workspace
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json ./package.json
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
RUN cd apps/api && npm ci

FROM deps AS builder

COPY apps/api ./apps/api
RUN cd apps/api && npm run build

FROM deps AS prod-deps

RUN cd apps/api && npm prune --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOAD_DIR=/app/uploads
ENV MEDIA_URL_PREFIX=/uploads

RUN mkdir -p /app/uploads && chown -R node:node /app

COPY --from=prod-deps --chown=node:node /workspace/package.json ./package.json
COPY --from=prod-deps --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps --chown=node:node /workspace/apps/api/package-lock.json ./apps/api/package-lock.json
COPY --from=prod-deps --chown=node:node /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /workspace/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
USER node
EXPOSE 4000

CMD ["node", "dist/main.js"]
