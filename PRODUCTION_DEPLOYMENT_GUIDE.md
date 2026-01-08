# Production Deployment Guide - Toolbay on Digital Ocean

## Complete deployment documentation for Toolbay multi-tenant e-commerce platform

---

## 🎯 Server Details

- **Platform**: Digital Ocean Droplet
- **OS**: Ubuntu 24.04 LTS
- **Domain**: toolbay.net
- **IP**: 164.92.212.186
- **Port**: 10000 (internal), 80/443 (external via Nginx)
- **SSL**: Let's Encrypt (auto-renews)

---

## 📋 Prerequisites Checklist

- [x] Digital Ocean Droplet running Ubuntu
- [x] Domain name (toolbay.net) pointing to droplet IP
- [x] SSH access to server
- [x] Git repository access
- [x] Production MongoDB database
- [x] Production environment variables

---

## 🚀 Initial Server Setup (One-time)

### 1. SSH into your droplet

```bash
ssh leo@toolbay.net
# or
ssh leo@164.92.212.186
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin -y

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 3. Clone the repository

```bash
cd ~
mkdir -p HomeLTD
cd HomeLTD
git clone git@github.com:RealLionelMuhire/toolboxx.git
cd toolboxx
```

### 4. Create production environment file

```bash
nano .env.production
```

**Add the following configuration:**

```bash
NODE_ENV=production
PORT=10000

# Database
DATABASE_URI=mongodb+srv://toolbaystore_db_user:IEdRPcmPzmJrGgk6@toolbayprodb.zphlktf.mongodb.net/toolbaydb?retryWrites=true&w=majority&appName=ToolbayProductionCluster
PAYLOAD_SECRET=456dc321fa8e3861ecc2d373eed69a6100acd09717af063e3627e3247f0019a1

# App URLs (IMPORTANT: Use HTTPS after SSL setup)
NEXT_PUBLIC_APP_URL=https://toolbay.net
NEXT_PUBLIC_ROOT_DOMAIN=toolbay.net
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=false

# Stripe (Use production keys for live transactions)
STRIPE_SECRET_KEY=sk_test_51RSlvhQNXfgJjmVmcxDVOhMuaDDWalu5oRhb00tNkU4lVwd0ZXG8FhQf51qWrS0gxaSDSSaXcSrk1xsIofQWdr0d00cQUbS90h
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RSlvhQNXfgJjmVmbxbORXTE4HHf9lBjtnokeXxem6ZaWlTO8Ifhti9MMc2N4wdCEOIGbjNZudVwVp6WdWDOljXE00WIlFINpT
STRIPE_WEBHOOK_SECRET=whsec_da810d29c67c2955ae27246f4d3f2566eb2eedbe4570e478c6ebda9285a447d5

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_stL2WgafPHil5ATC_F74doONeFL88DfPYegMeJmmjEe3g2z

# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLeVKTDnMj65UCfFcfoBmEouXdKTDRcyLeF_7Sc64fkRxF8knQsYcLzco9PM4aYIIrMbBeU8i783P1R4SDlh6gE
VAPID_PRIVATE_KEY=NflOoTj5qVB3FLhoVdWMkOE5scSTC9CEsuYwUitu73Y
VAPID_EMAIL=mailto:lionelmuhire1997@gmail.com

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mlcorporateservicesit@gmail.com
SMTP_PASS=fksg puuj hqtq rsdr
SMTP_FROM_EMAIL=noreply@toolbay.store
SMTP_FROM_NAME=Toolbay

# Resend API
RESEND_API_KEY=re_B9Locd8M_ASuAoooS9D1RE8PTT89SYGqr
```

Save with `Ctrl+X`, `Y`, `Enter`.

### 5. Initial deployment

```bash
cd ~/HomeLTD/toolboxx
docker compose --env-file .env.production up -d --build
```

Wait for build to complete (3-5 minutes first time).

```bash
# Check if running
docker compose ps

# View logs
docker compose logs -f
```

### 6. Configure firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 10000/tcp # App port

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 7. Install and configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/toolbay
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name toolbay.net www.toolbay.net;

    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/toolbay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Configure DNS

In your cPanel or DNS provider (e.g., cPanel DNS Zone Editor):

**Add/Update these A records:**

```
Type: A
Name: @
Address: 164.92.212.186
TTL: 3600

Type: A
Name: www
Address: 164.92.212.186
TTL: 3600
```

**Remove any conflicting A records** pointing to old IPs.

**Verify DNS propagation:**

```bash
dig toolbay.net +short
# Should return: 164.92.212.186
```

### 9. Install SSL Certificate

**Wait for DNS to propagate (5-30 minutes), then:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d toolbay.net -d www.toolbay.net
```

Follow the prompts. Certbot will automatically:
- Obtain the certificate
- Configure Nginx for HTTPS
- Set up automatic renewal

**Verify SSL is working:**

```bash
curl -I https://toolbay.net
```

### 10. Update app to use HTTPS

```bash
nano ~/HomeLTD/toolboxx/.env.production
```

Change:
```bash
NEXT_PUBLIC_APP_URL=https://toolbay.net  # Change http to https
```

Rebuild the app:

```bash
cd ~/HomeLTD/toolboxx
./deploy.sh
# or manually:
docker compose down
docker compose --env-file .env.production up -d --build
```

---

## 🔄 Regular Deployment Workflow

### Update and Deploy Changes

**On your local machine:**

```bash
cd ~/HomeLTD/toolboxx

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Your change description"
git push origin main
```

**On the server:**

```bash
ssh leo@toolbay.net
cd ~/HomeLTD/toolboxx

# Use the deployment script
./deploy.sh

# Or manually:
git pull origin main
docker compose down
docker compose --env-file .env.production up -d --build
docker compose logs -f
```

---

## 🛠️ Useful Commands

### Container Management

```bash
# View running containers
docker compose ps

# View logs (live)
docker compose logs -f

# View logs (last 100 lines)
docker compose logs --tail=100

# Stop containers
docker compose down

# Restart containers
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check Docker resource usage
docker stats

# Check running processes
htop  # or top
```

### Nginx Management

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (without downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Management

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificates manually (auto-renewal is configured)
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

### Database Management

```bash
# Connect to MongoDB (if needed)
# Use MongoDB Compass or mongo shell with your connection string

# Backup database
# Use mongodump or MongoDB Atlas backups
```

---

## 🔍 Troubleshooting

### Site is down

```bash
# Check if containers are running
docker compose ps

# Check container logs
docker compose logs --tail=100

# Check Nginx status
sudo systemctl status nginx

# Check if port is listening
sudo netstat -tlnp | grep 10000
```

### Build fails

```bash
# Check for errors in logs
docker compose logs

# Clear Docker cache and rebuild
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Verify DNS is pointing correctly
dig toolbay.net +short

# Check Nginx SSL config
sudo cat /etc/nginx/sites-enabled/toolbay

# Renew certificate
sudo certbot renew --force-renewal
```

### Memory issues

```bash
# Check memory usage
free -h

# Restart containers to free memory
docker compose restart

# Clear Docker system resources
docker system prune -a
```

### Can't connect to database

```bash
# Check environment variables
docker compose exec app env | grep DATABASE_URI

# Test MongoDB connection
docker compose exec app node -e "require('mongodb').MongoClient.connect(process.env.DATABASE_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

---

## 🔐 Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords** for all services

3. **Enable firewall** (already configured)

4. **Regular backups** of database and media files

5. **Monitor logs** for suspicious activity
   ```bash
   sudo tail -f /var/log/auth.log  # SSH attempts
   sudo tail -f /var/log/nginx/access.log  # Web traffic
   ```

6. **Disable root SSH login**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

7. **Set up automatic security updates**
   ```bash
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

---

## 📊 Performance Optimization

### Enable Nginx caching

```bash
sudo nano /etc/nginx/sites-available/toolbay
```

Add inside the `location /` block:

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    proxy_pass http://localhost:10000;
    proxy_cache_valid 200 30d;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Monitor performance

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system load
htop

# Check disk I/O
sudo iotop

# Check network usage
sudo nethogs
```

---

## 🔄 Rollback Procedure

If a deployment breaks the site:

```bash
cd ~/HomeLTD/toolboxx

# Rollback to previous git commit
git log --oneline  # Find the commit hash
git checkout <previous-commit-hash>

# Rebuild
docker compose down
docker compose --env-file .env.production up -d --build

# Or go back to main branch
git checkout main
git reset --hard HEAD~1  # Go back one commit
```

---

## 📞 Support Contacts

- **Developer**: Lionel Muhire (lionelmuhire1997@gmail.com)
- **Hosting**: Digital Ocean Support
- **Domain**: cPanel/DNS Provider Support
- **SSL**: Let's Encrypt (https://letsencrypt.org/docs/)

---

## 📝 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-08 | Initial deployment to Digital Ocean | Leo |
| 2026-01-08 | SSL certificate configured | Leo |
| 2026-01-08 | Nginx reverse proxy setup | Leo |

---

## 🎉 Deployment Complete!

Your Toolbay application is now running in production:

- **Live URL**: https://toolbay.net
- **Admin Panel**: https://toolbay.net/admin
- **API**: https://toolbay.net/api

**Next Steps:**
1. Monitor logs for errors
2. Test all functionality
3. Set up monitoring/alerting
4. Configure automated backups
5. Update Stripe to production keys when ready
