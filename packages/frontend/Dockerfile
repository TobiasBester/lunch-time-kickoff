# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# VITE_API_BASE_URL is baked into the static bundle at build time.
# In CI it is set to the deployed backend Cloud Run URL.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build shared package first, then frontend
RUN npm run build:shared
RUN npm run build:frontend

# Production stage - serve with Nginx
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Cloud Run expects the app to listen on PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
