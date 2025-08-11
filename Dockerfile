# root dockerfile for railway

FROM docker/compose:latest

WORKDIR /app

COPY . .

RUN apk add --no-cache docker-cli

CMD ["docker-compose", "up"]