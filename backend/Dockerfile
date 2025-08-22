FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

EXPOSE 8080

COPY package*.json ./

COPY . .

RUN npm install

CMD [ "npm", "run", "run" ]
