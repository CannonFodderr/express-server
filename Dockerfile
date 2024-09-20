# Stage 1: Build TypeScript code
FROM node:20.14.0 AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN yarn global add typescript \
    && yarn add --frozen-lockfile \
    rm -rf /tmp/*

COPY . .

RUN yarn build

# Stage 2: Create production image
FROM node:20.14.0-alpine AS production

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
