# Stage 1: Build TypeScript code
FROM node:20.14.0 AS builder

WORKDIR /app

COPY package.json ./
COPY provider.json ./
RUN yarn global add typescript
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Stage 2: Create production image
FROM node:20.14.0-alpine

WORKDIR /app

COPY package.json ./
RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/provider.json ./provider.json

EXPOSE 8000

CMD ["node", "dist/index.js"]
