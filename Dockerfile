# Streamlined Railway deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set memory limits and optimization flags
ENV NODE_OPTIONS="--max_old_space_size=2048"
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application directly with vite
RUN ./node_modules/.bin/vite build

# Clean up dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose port (Railway will set PORT env var)
EXPOSE 4173

# Start the Express server
CMD ["node", "server.js"]
