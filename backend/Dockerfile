FROM node:20-alpine

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=development

COPY package*.json ./
COPY . .

RUN apk update && npm install && npx prisma db push

CMD [ "npm", "run", "dev" ]
