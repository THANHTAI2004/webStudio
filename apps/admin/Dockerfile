FROM node:22-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_SITE_URL=

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

ARG NEXT_PUBLIC_SITE_URL=

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3001

CMD ["node", "server.js"]
