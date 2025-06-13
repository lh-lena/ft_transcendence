FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install dotenv env-schema @fastify/cors
COPY . .
CMD ["npm", "run", "dev"]
