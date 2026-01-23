# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with optimization flags
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source
COPY index.html vite.config.ts tsconfig.json tailwind.config.js postcss.config.js ./
COPY src ./src

# Build
RUN npm run build

# Write version file if VERSION build arg is provided
ARG VERSION
RUN if [ -n "$VERSION" ]; then echo "{\"version\":\"$VERSION\"}" > dist/version.json; fi

# Stage 2: Backend with frontend
FROM node:22-alpine
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

EXPOSE 4000
CMD ["node", "index.js"]
