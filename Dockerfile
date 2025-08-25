# Multi-stage build for Railway deployment
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set memory limits and optimization flags
ENV NODE_OPTIONS="--max_old_space_size=2048"
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production && npm ci --only=development

# Copy source code
COPY . .

# Build the application with optimizations
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port (Railway will set PORT env var)
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4173), (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the Express server
CMD ["node", "server.js"]
