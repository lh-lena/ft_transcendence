FROM node:20

# Install build dependencies for argon2 and sqlite3
RUN apt-get update && \
    apt-get install -y python3 make g++ sqlite3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
