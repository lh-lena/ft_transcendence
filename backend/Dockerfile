FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm exec prisma generate

CMD [ "/bin/sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || echo 'Seed already run or failed, continuing...') && npm run run" ]
