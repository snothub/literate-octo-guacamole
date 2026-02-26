# Stage 1: Build frontend
FROM node:25-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci && \
    rm -rf /root/.npm

# Copy source files needed for build
COPY index.html ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY src ./src

# Build
RUN npm run build

# Write version file if VERSION build arg is provided
ARG VERSION
RUN if [ -n "$VERSION" ]; then echo "{\"version\":\"$VERSION\"}" > dist/version.json; fi

# Stage 2: Backend with frontend
FROM node:25-alpine
WORKDIR /app

# Install openssl (needed for Prisma)
RUN apk add --no-cache openssl

# Copy backend files
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

# Install backend dependencies
RUN npm ci --prefer-offline --no-audit --progress=false --only=production && \
    npx prisma generate

# Copy backend code
COPY backend/index.js ./

# Copy frontend build
COPY --from=frontend-builder /app/dist ./public
RUN addgroup appgroup && adduser -D appuser -G appgroup

RUN chown -R appuser:appgroup /app/public && \
    chown -R appuser:appgroup /app/index.js
    
USER appuser


EXPOSE 4000
CMD ["node", "index.js"]
