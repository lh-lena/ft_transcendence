FROM node:20-alpine

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=development

COPY package*.json ./
COPY . .

RUN apk update && apk add --no-cache sqlite sqlite-libs && npm install

CMD ["npm", "run", "dev"]
