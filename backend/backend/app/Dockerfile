FROM node:20-alpine

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=development

COPY package*.json ./
COPY . .

CMD ["tail", "-f"]
