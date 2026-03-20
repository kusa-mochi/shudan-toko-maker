# syntax=docker/dockerfile:1
FROM node:20.14.0-alpine3.19

ENV NODE_ENV=development
ENV PORT=3000
WORKDIR /app

RUN apk add --no-cache su-exec

# Create UID/GID 1000 user for local dev container runtime
RUN addgroup -S appgroup || true \
 && addgroup -g 1000 appgroup 2>/dev/null || true \
 && adduser -S -D -G appgroup -u 1000 appuser 2>/dev/null || adduser -S -D -G appgroup appuser

EXPOSE 3000

CMD ["sh", "-c", "cd /app && su-exec 1000:1000 npm run dev"]
