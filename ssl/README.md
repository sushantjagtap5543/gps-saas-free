# SSL Certificates

Place your SSL certificates in this folder for HTTPS support.

## Using Let's Encrypt (Recommended)

1. Install certbot:
```bash
sudo apt install certbot
```

2. Generate certificates:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Copy certificates:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

4. Update nginx.conf to enable HTTPS (uncomment the HTTPS server block)

## Using Self-Signed Certificates (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Files

- `cert.pem` - SSL certificate (full chain)
- `key.pem` - Private key

**Note:** Never commit private keys to version control!
