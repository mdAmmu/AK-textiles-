# AWS Deployment Plan (Simple Guide)

This document explains, in plain steps, how to move AK Textiles from your
laptop to AWS. Follow the parts in order.

## What we are building

```
User's Browser
     |
     |  (https://yourdomain.com)
     v
CloudFront (CDN)  ---->  S3 Bucket (Frontend build files)
     |
     |  (calls the API, e.g. https://api.yourdomain.com)
     v
EC2 Server (Nginx + FastAPI backend)
     |
     |-----> Neon (Postgres Database) -- stays where it is, no change
     |
     |-----> S3 Bucket (Product images, chat images, chat files)
```

Three AWS pieces:
1. **S3 + CloudFront** — hosts the frontend (the React website).
2. **EC2** — runs the backend (FastAPI + WebSocket chat).
3. **S3 (a second bucket)** — stores uploaded files (product photos, chat
   images, chat files) instead of Supabase Storage.

The database keeps using **Neon** (Postgres) exactly as it does today —
nothing changes there.

---

## Part 0: Code change needed before deploying — move file storage to S3

Right now the backend uploads files to **Supabase Storage**
(`backend/app/core/supabase_client.py`). Since we want file storage on AWS,
this file needs to be rewritten to use **S3** instead. This is a small
coding task to do first, before touching AWS:

1. Add `boto3` to `backend/requirements.txt`.
2. Write a new file, e.g. `backend/app/core/s3_client.py`, with the same
   three functions the app already uses:
   - `upload_product_image(filename, content, content_type)`
   - `upload_chat_image(filename, content, content_type)`
   - `upload_chat_file(filename, content, content_type)`

   Each function uploads the bytes to the S3 bucket and returns a public
   URL (either a plain S3 URL or, later, a CloudFront URL for the same
   bucket).
3. Update every place that imports from `supabase_client.py` to import
   from `s3_client.py` instead (search the codebase for
   `supabase_client` to find them).
4. Existing files already stored in Supabase Storage need to be copied
   over to the new S3 bucket (a one-off script, similar to
   `backend/scripts/migrate_webp_images.py`), and the URLs saved in the
   database need to be updated to the new S3/CloudFront URLs.
5. Test this locally first (upload a product image, send a chat image)
   before deploying.

Do this step first. Everything below assumes it is done.

---

## Part 1: Create your AWS account and an IAM user

1. Sign up / log in at https://aws.amazon.com.
2. Do **not** use your root account for daily work. Instead:
   - Go to **IAM** → **Users** → **Create user**.
   - Name it something like `ak-textiles-admin`.
   - Attach the policy `AdministratorAccess` for now (you can lock this
     down later).
   - Create an **access key** for this user (needed for the CLI and for
     the backend's S3 access). Save the Access Key ID and Secret Access
     Key somewhere safe.
3. Install the AWS CLI on your machine and run `aws configure`, pasting
   in the access key, secret key, and your preferred region (e.g.
   `ap-south-1` for Mumbai).

---

## Part 2: Create the S3 bucket for file storage

This bucket stores product images, chat images, and chat files.

1. Go to **S3** → **Create bucket**.
2. Name it something unique, e.g. `ak-textiles-media` (you already have
   this name in your `.env` file).
3. Region: pick one close to your users, e.g. `ap-south-1`.
4. **Uncheck** "Block all public access" only if you want files to be
   directly viewable by URL (needed for product/chat images to load in
   the browser). If you prefer private files, skip this and serve files
   through CloudFront with signed URLs instead (more advanced, optional
   for later).
5. Add a **bucket policy** that allows public `GetObject` (read-only) if
   you chose the public option, so images can be viewed by anyone with
   the link.
6. Create a separate **IAM user** just for the backend (do not use your
   admin user in production). Give it a policy that only allows
   `PutObject` / `GetObject` on this one bucket. Save its access key and
   secret key — these go into the backend's `.env` file as
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

---

## Part 3: Launch the EC2 server for the backend

1. Go to **EC2** → **Launch instance**.
2. Choose **Ubuntu 22.04 LTS**.
3. Instance type: `t3.small` is a good starting point (you can resize
   later).
4. Create a new **key pair** (`.pem` file) — this is how you SSH into
   the server. Download and keep it safe.
5. **Security group** (firewall rules), allow:
   - Port `22` (SSH) — only from your own IP if possible.
   - Port `80` (HTTP)
   - Port `443` (HTTPS)
6. Launch the instance and note its **public IP address**.
7. Allocate an **Elastic IP** and attach it to this instance, so the IP
   never changes even if you restart the server.

### Install everything on the server

SSH into the server:
```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

Install system packages:
```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx git
```

Clone your repo and set up the backend, same as you do locally:
```bash
git clone <your-repo-url> ak-textiles
cd ak-textiles/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create the `backend/.env` file on the server with the real production
values:
- `DATABASE_URL` — your Neon connection string (same one you use now)
- `JWT_SECRET` — a new, long random string (different from dev)
- `CORS_ORIGINS` — your real frontend domain, e.g.
  `["https://yourdomain.com"]`
- `FRONTEND_BASE_URL` — `https://yourdomain.com`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` /
  `S3_BUCKET_NAME` — the backend-only IAM user from Part 2

Run the database migrations:
```bash
alembic upgrade head
```

### Keep the backend running (systemd service)

Create a file `/etc/systemd/system/ak-backend.service`:
```ini
[Unit]
Description=AK Textiles Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ak-textiles/backend
ExecStart=/home/ubuntu/ak-textiles/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start it:
```bash
sudo systemctl enable ak-backend
sudo systemctl start ak-backend
```

This makes the backend restart automatically if it crashes or the server
reboots.

### Put Nginx in front (reverse proxy + HTTPS)

Nginx receives the public traffic and forwards it to the backend running
on `127.0.0.1:8000`. It also handles WebSocket connections (used by the
live chat feature) and HTTPS.

Create `/etc/nginx/sites-available/ak-backend`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/ak-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Add free HTTPS with Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Certbot edits the Nginx config to serve HTTPS and auto-renews the
certificate.

---

## Part 4: Point your domain at AWS

1. Buy a domain (Route 53, GoDaddy, Namecheap — any registrar works).
2. Create two DNS records:
   - `api.yourdomain.com` → **A record** pointing to the EC2 Elastic IP.
   - `yourdomain.com` (or `www.yourdomain.com`) → will point to
     CloudFront (set up in the next part).

---

## Part 5: Build and host the frontend (S3 + CloudFront)

### Build the frontend

On your own machine (or a CI pipeline):
```bash
cd frontend
```
Update `frontend/.env` (or set it in your build environment) so it
points at the real backend:
```
VITE_API_BASE_URL=https://api.yourdomain.com
```
Then build:
```bash
npm install
npm run build
```
This creates a `dist/` folder with the static website files.

### Create the frontend S3 bucket

1. Go to **S3** → **Create bucket**, e.g. `ak-textiles-frontend`.
2. Keep it **private** (CloudFront will access it securely — you do not
   need to make this bucket public).
3. Upload the contents of `frontend/dist/` into this bucket (you can
   drag-and-drop in the console, or use the CLI):
   ```bash
   aws s3 sync frontend/dist s3://ak-textiles-frontend
   ```

### Create the CloudFront distribution

1. Go to **CloudFront** → **Create distribution**.
2. **Origin**: select the `ak-textiles-frontend` S3 bucket.
3. Use **"Origin Access Control"** so only CloudFront can read the
   bucket (S3 stays private).
4. **Viewer protocol policy**: "Redirect HTTP to HTTPS".
5. **Default root object**: `index.html`.
6. Under **Error pages**, add a custom error response: for HTTP error
   `403` and `404`, return `/index.html` with response code `200`. This
   is required because this is a Single Page App (React Router) — if you
   skip this, refreshing a page like `/products/5` will show an error.
7. Request a free SSL certificate for your domain in **AWS Certificate
   Manager (ACM)** (must be created in the `us-east-1` region for
   CloudFront), and attach it to the distribution, along with your
   domain name (`yourdomain.com`).
8. Once the distribution is created, point your domain's DNS
   (`yourdomain.com`) to the CloudFront distribution using an **A record
   (alias)** in Route 53, or a **CNAME** if using another DNS provider.

### Redeploying the frontend later

Whenever you make frontend changes:
```bash
npm run build
aws s3 sync frontend/dist s3://ak-textiles-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```
The invalidation step clears CloudFront's cache so users see the new
version immediately.

---

## Part 6: Final checklist before going live

- [ ] `backend/.env` on EC2 has production values (real `JWT_SECRET`,
      real `CORS_ORIGINS`, real S3 bucket)
- [ ] `alembic upgrade head` has been run against the Neon database
- [ ] Backend responds at `https://api.yourdomain.com/health`
- [ ] Frontend loads at `https://yourdomain.com` and can log in
- [ ] Uploading a product image works and the image loads from S3
- [ ] Chat (WebSocket) works over `wss://api.yourdomain.com`
- [ ] Elastic IP is attached (server IP won't change on reboot)
- [ ] `ak-backend` systemd service is enabled (restarts on crash/reboot)

---

## Part 7: Ongoing maintenance

- **Backend updates**: SSH into EC2, `git pull`, reinstall
  requirements if changed, run new migrations, then
  `sudo systemctl restart ak-backend`.
- **Frontend updates**: rebuild locally and re-run the `aws s3 sync` +
  `cloudfront create-invalidation` commands from Part 5.
- **Database**: stays fully managed by Neon — no server maintenance
  needed on your side.
- **Costs to expect roughly**: EC2 `t3.small` (~$15/month), S3 storage
  (a few dollars, based on usage), CloudFront (a few dollars, based on
  traffic), Elastic IP (free while attached to a running instance).
