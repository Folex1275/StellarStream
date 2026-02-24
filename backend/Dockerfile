FROM node:18-alpine AS builder
WORKDIR /app

# Install build deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app

# Copy built output and package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Add curl to fetch wait-for-it and cleanup
RUN apk add --no-cache curl && \
    curl -sSL https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/local/bin/wait-for-it.sh && \
    chmod +x /usr/local/bin/wait-for-it.sh && \
    apk del curl || true

ENV NODE_ENV=production
EXPOSE 3000

# Wait for DB then start the app
CMD ["sh","-c","/usr/local/bin/wait-for-it.sh db:5432 -- npm run start"]
