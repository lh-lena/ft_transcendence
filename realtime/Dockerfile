FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY ./package*.json ./
COPY ./tsconfig.json ./
RUN npm install --frozen-lockfile
COPY ./src ./src
RUN npm run build
EXPOSE 8081
CMD ["npm", "run", "dev"]
