# Digital Ocean Droplet Deployment Guide

## Prerequisites

- Digital Ocean account
- Docker installed on droplet
- Domain name (optional, but recommended)

## Option 1: Deploy Using Docker Compose (Recommended)

### Step 1: Set up your droplet

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone and configure

```bash
# Clone your repository
git clone <your-repo-url> /app
cd /app

# Create .env.production file with your production values
nano .env.production
```

**Important**: Update `.env.production` with:
- Production MongoDB URI
- Production app URL (e.g., `https://yourdomain.com`)
- Production Stripe keys
- All other production environment variables

### Step 3: Build and run

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build the image
docker compose build

# Run the container
docker compose up -d

# Check logs
docker compose logs -f
```

### Step 4: Set up Nginx reverse proxy (optional but recommended)

```bash
# Install Nginx
apt-get update
apt-get install nginx

# Create Nginx config
nano /etc/nginx/sites-available/toolbay
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/toolbay /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Install SSL with Let's Encrypt (recommended)
apt-get install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Option 2: Direct Docker Run

```bash
# Build the image
docker build -t toolbay-app .

# Run the container
docker run -d \
  --name toolbay \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e DATABASE_URI="your_mongodb_uri" \
  -e PAYLOAD_SECRET="your_secret" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -e STRIPE_SECRET_KEY="your_stripe_key" \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_pub_key" \
  -e BLOB_READ_WRITE_TOKEN="your_blob_token" \
  -e RESEND_API_KEY="your_resend_key" \
  toolbay-app

# Check logs
docker logs -f toolbay
```

## Useful Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# Restart the app
docker compose restart

# Stop the app
docker compose down

# Rebuild and restart
docker compose up -d --build

# Remove everything and start fresh
docker compose down -v
docker compose up -d --build
```

## Updating Your App

```bash
cd /app
git pull origin main
docker compose up -d --build
```

## Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Monitoring

```bash
# Check container status
docker compose ps

# View resource usage
docker stats

# Check app health
curl http://localhost:3000
```

## Troubleshooting

### Container won't start
```bash
docker compose logs
```

### Check if port is already in use
```bash
netstat -tulpn | grep 3000
```

### Reset everything
```bash
docker compose down
docker system prune -a
docker compose up -d --build
```

## Environment Variables Checklist

Make sure your `.env.production` includes:

- ✅ `DATABASE_URI` - MongoDB connection string
- ✅ `PAYLOAD_SECRET` - Random secret key
- ✅ `NEXT_PUBLIC_APP_URL` - Your production URL
- ✅ `NEXT_PUBLIC_ROOT_DOMAIN` - Your domain
- ✅ `STRIPE_SECRET_KEY` - Production Stripe key
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Production Stripe publishable key
- ✅ `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- ✅ `RESEND_API_KEY` - Resend API key
- ✅ `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` - Push notification keys
- ✅ `SMTP_*` variables - Email configuration

## Security Recommendations

1. **Never commit `.env.production` to git**
2. Use strong `PAYLOAD_SECRET` (generate with: `openssl rand -hex 32`)
3. Enable UFW firewall
4. Set up automatic security updates
5. Use SSL/HTTPS (Let's Encrypt is free)
6. Consider setting up automatic backups for MongoDB
7. Use Docker secrets for sensitive data in production

## Performance Tips

1. Enable Nginx caching for static assets
2. Set up CDN for media files
3. Monitor with `docker stats`
4. Consider using Docker Swarm or Kubernetes for scaling
5. Set up log rotation to prevent disk space issues
