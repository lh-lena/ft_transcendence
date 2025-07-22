FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=development

COPY package*.json ./

COPY . .

ENV DATABASE_URL="file:/app/data/database.sqlite"

RUN npm install && npx prisma db push

CMD [ "npm", "run", "dev" ]
