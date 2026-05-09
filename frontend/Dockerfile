FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# NEXT_PUBLIC_* is inlined at build time; default keeps `next build` working when no host .env exists.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Run as non-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs \
  && chown -R nextjs:nextjs /app \
  && mkdir -p /home/nextjs \
  && chown -R nextjs:nextjs /home/nextjs

USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]

