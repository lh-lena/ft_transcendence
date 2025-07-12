FROM node:20-alpine

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=development

COPY package*.json ./
COPY . .

RUN npm install && apk add --no-cache sqlite

CMD ["npm", "run", "dev"]
