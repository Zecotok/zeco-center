# Server Deployment Instructions

1. Build the application:
   `npm run lean-build`

2. Upload the build to server:
   `npm run upload-build`

3. Upload program files:
   `npm run upload-programs`

4. Upload scene files:
   `npm run upload-scenes`

5. Restart the production server:
   `npm run restart-prod`

6. View logs:
   `npm run logs`

Quick deploy:
`npm run deploy`

## Nginx and Domain Setup for server.zecotok.com

### Prerequisites
- Domain zecotok.com is managed through Wix
- Access to domain DNS settings in Wix dashboard
- SSH access to server (13.127.161.131)
- Nginx installed on server

### DNS Configuration
1. Log in to Wix dashboard
2. Go to Domains > zecotok.com > DNS Records
3. Add new A record:
   - Host: server
   - Points to: 13.127.161.131
   - TTL: 3600

### SSH Setup
1. Ensure you have the private key (~/.ssh/server2025.pem)
2. Set correct permissions:
   ```bash
   chmod 400 ~/.ssh/server2025.pem
   ```
3. Test SSH connection:
   ```bash
   ssh -i ~/.ssh/server2025.pem ubuntu@13.127.161.131
   ```

### Nginx Configuration
1. SSH into server
2. Create new Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/server.zecotok.com
   ```
3. Add configuration:
   ```nginx
   server {
       listen 80;
       server_name server.zecotok.com;

       location / {
           proxy_pass http://localhost:3002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/server.zecotok.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### SSL Certificate (Optional)
1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```
2. Obtain certificate:
   ```bash
   sudo certbot --nginx -d server.zecotok.com
   ```
3. Follow prompts to configure HTTPS

Note: DNS propagation may take up to 48 hours. The application will be accessible at https://server.zecotok.com once DNS is propagated.

