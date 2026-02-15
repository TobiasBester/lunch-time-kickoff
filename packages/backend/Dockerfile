# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package first, then backend
RUN npm run build:shared
RUN npm run build:backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files for production dependencies only
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Cloud Run will set PORT environment variable
ENV NODE_ENV=production
EXPOSE 8080

# Run the backend
CMD ["node", "packages/backend/dist/index.js"]
