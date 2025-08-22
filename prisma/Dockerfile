FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --verbose
RUN npm list --depth=0

COPY prisma ./prisma

RUN npm exec prisma generate

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]
