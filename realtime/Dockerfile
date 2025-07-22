FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
EXPOSE 8081
CMD ["sh", "-c", "npm run build && node dist/server.js"]