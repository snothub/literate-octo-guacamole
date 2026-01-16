# Deployment Guide

This guide explains how to deploy the Spotify Loop Player application using Docker Hub and GitHub Actions.

## Architecture

The application consists of three Docker containers:
1. **Frontend** (`music-man:latest`) - React app served by nginx on port 3000
2. **Backend API** (`music-man-api:latest`) - Express.js API on port 4000
3. **Database** (`postgres:16-alpine`) - PostgreSQL database on port 5432

## Automated CI/CD with GitHub Actions

### How It Works

The GitHub Actions workflow (`.github/workflows/docker-image.yml`) automatically:
1. Triggers on push/PR to the `main` branch
2. Builds both frontend and backend Docker images
3. Tags images with:
   - Short git commit SHA (e.g., `abc1234`)
   - `latest` tag
4. Pushes images to Docker Hub

### Setup GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `johndoe` |
| `DOCKERHUB_TOKEN` | Docker Hub access token | `dckr_pat_xxxxx` |

**To create a Docker Hub access token:**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: `GitHub Actions`
4. Access permissions: `Read, Write, Delete`
5. Generate and copy the token
6. Add it as `DOCKERHUB_TOKEN` secret in GitHub

### Docker Hub Images

After the workflow runs, images are available at:
- Frontend: `docker pull <your-username>/music-man:latest`
- Backend: `docker pull <your-username>/music-man-api:latest`

## Deploying to Production

### Option 1: Using Pre-built Images from Docker Hub

Create a `docker-compose.prod.yml` file:

```yaml
version: '3.8'

services:
  frontend:
    image: <your-dockerhub-username>/music-man:latest
    ports:
      - "3000:80"
    restart: unless-stopped
    depends_on:
      - api

  api:
    image: <your-dockerhub-username>/music-man-api:latest
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://spotify_user:${DB_PASSWORD}@db:5432/spotify_db
      PORT: 4000
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: spotify_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: spotify_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U spotify_user -d spotify_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:
```bash
# Set database password
export DB_PASSWORD="your-secure-password-here"

# Pull latest images and start
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Using Specific Versions

To deploy a specific git commit version:

```bash
# Pull specific version by commit SHA
docker pull <your-username>/music-man:abc1234
docker pull <your-username>/music-man-api:abc1234

# Update docker-compose.prod.yml to use specific tags
# Then run:
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables for Production

### Frontend (.env)
```
VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
VITE_API_URL=https://your-api-domain.com
```

Rebuild frontend if these change.

### Backend (docker-compose.prod.yml)
```yaml
environment:
  DATABASE_URL: postgresql://spotify_user:secure-password@db:5432/spotify_db
  PORT: 4000
```

### Database
```yaml
environment:
  POSTGRES_USER: spotify_user
  POSTGRES_PASSWORD: secure-password-here
  POSTGRES_DB: spotify_db
```

**Important:** Use strong passwords and never commit them to git!

## Security Recommendations

1. **Use secrets management**
   - Use Docker Secrets or environment variable files (.env)
   - Never commit credentials to git

2. **Database security**
   - Use strong passwords
   - Don't expose PostgreSQL port publicly
   - Keep database inside Docker network

3. **HTTPS/SSL**
   - Use reverse proxy (nginx, Caddy, Traefik)
   - Get SSL certificates (Let's Encrypt)
   - Redirect HTTP to HTTPS

4. **Firewall**
   - Only expose ports 80 (HTTP) and 443 (HTTPS)
   - Block direct access to ports 3000, 4000, 5432

## Monitoring

Check container status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

View logs:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f db
```

## Backup Database

Regular backups:
```bash
# Backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U spotify_user spotify_db > backup.sql

# Restore
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U spotify_user spotify_db
```

## Updating the Application

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images (zero downtime with health checks)
docker-compose -f docker-compose.prod.yml up -d

# Or for guaranteed clean state:
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Rollback to Previous Version

```bash
# Find previous version from Docker Hub or GitHub Actions
docker pull <your-username>/music-man:abc1234
docker pull <your-username>/music-man-api:abc1234

# Update docker-compose to use that version
# Then restart
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Images not found on Docker Hub
- Check GitHub Actions workflow ran successfully
- Verify Docker Hub credentials are correct
- Check repository secrets are set

### Database connection errors
- Verify PostgreSQL is healthy: `docker-compose exec db pg_isready`
- Check DATABASE_URL is correct
- Ensure database migrations ran: check API logs

### Frontend can't reach backend
- Verify VITE_API_URL points to correct backend URL
- Check backend is running and healthy
- Verify CORS is configured correctly

## Reference

- Docker Hub: https://hub.docker.com/
- GitHub Actions: https://github.com/features/actions
- Docker Compose: https://docs.docker.com/compose/
