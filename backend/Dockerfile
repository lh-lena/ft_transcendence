FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
RUN apk add --no-cache sqlite
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]