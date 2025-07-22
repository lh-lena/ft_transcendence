FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY ./package*.json ./
RUN npm install --frozen-lockfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install --frozen-lockfile
COPY ./src ./src
RUN npm run build
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 8081
CMD ["npm", "run", "start"]