# FROM node:20

# # Install build dependencies for argon2 and sqlite3
# RUN apt-get update && \
#     apt-get install -y python3 make g++ sqlite3 && \
#     rm -rf /var/lib/apt/lists/*

# WORKDIR /app


# COPY . .

# ENV DATABASE_URL="file:/app/data/database.sqlite"

# RUN npx prisma db push --schema=../backend/prisma/schema.prisma


# CMD ["npm", "run", "dev"]

# Use Node.js 20 as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Expose the port your service uses
EXPOSE 3000

# Start the service
CMD ["npm", "start"]
