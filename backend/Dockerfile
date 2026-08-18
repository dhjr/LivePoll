# Base Image: Lightweight Node.js 22 Alpine Linux
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend source code
COPY . .

# Expose backend server port
EXPOSE 3001

# Start command
CMD ["node", "server.js"]
