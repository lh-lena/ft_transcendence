FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm exec prisma generate

CMD [ "/bin/sh", "-c", "npx prisma migrate deploy && npm run run" ]
