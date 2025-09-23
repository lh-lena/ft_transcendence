# Use Node.js 20 as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --fetch-timeout=60000 --cache /tmp/npm-cache

# Copy the source code
COPY . .

# Expose the port your service uses
EXPOSE 3000

# Start the service
CMD ["npm", "start"]
