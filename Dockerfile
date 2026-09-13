# Stage 1: Build static assets with Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./

# Install dependencies cleanly
RUN npm install

# Build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_PUBLIC_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_MOCK_MODE=false

# Expose to environment during build
ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_MOCK_MODE=$VITE_MOCK_MODE

# Copy source code
COPY . .

# Build application into dist/
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 as required by Render
EXPOSE 8080

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
