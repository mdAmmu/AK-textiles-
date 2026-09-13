# AWS Deployment Plan (Simple Guide)

This document explains, in plain steps, how to move AK Textiles from your
laptop to AWS. Follow the parts in order.

## What we are building

```
User's Browser
     |
     |  (http://13.126.206.134, will be https://yourdomain.com later)
     v
EC2 Server
     |
     |-----> Nginx
     |          |-----> serves the frontend build files directly
     |          |-----> proxies API + WebSocket routes to FastAPI (port 8000)
     |
     |-----> Neon (Postgres Database) -- stays where it is, no change
     |
     |-----> S3 Bucket (Product images, chat images, chat files)
```

**Change from the original plan:** the frontend was originally going to be
hosted separately on S3 + CloudFront. Since there's no domain yet, and to
keep things simple, the frontend build is instead served directly from
the same EC2 instance via Nginx, right alongside the backend. This also
avoids CORS entirely, since the frontend and API now share the same
origin. S3 + CloudFront can be added later if you want a CDN in front of
the frontend (see the note at the end of Part 5).

Two AWS pieces:
1. **EC2** — runs the backend (FastAPI + WebSocket chat) and serves the
   built frontend, both through Nginx.
2. **S3** — stores uploaded files (product photos, chat images, chat
   files) instead of Supabase Storage.

The database keeps using **Neon** (Postgres) exactly as it does today —
nothing changes there.

---

## Part 0: Code change needed before deploying — move file storage to S3 ✅ Done

Right now the backend uploads files to **Supabase Storage**
(`backend/app/core/supabase_client.py`). Since we want file storage on AWS,
this file needed to be rewritten to use **S3** instead. This was done on
the `aws-migration` branch:

1. Added `boto3` to `backend/requirements.txt` (removed the `supabase`
   package).
2. Added `backend/app/core/s3_client.py`, with the same three functions
   the app already used:
   - `upload_product_image(filename, content, content_type)`
   - `upload_chat_image(filename, content, content_type)`
   - `upload_chat_file(filename, content, content_type)`

   Each function uploads the bytes to the S3 bucket and returns a public
   URL (a plain S3 URL for now; can switch to a CloudFront URL for the
   same bucket later).
3. Updated every place that imported from `supabase_client.py` to import
   from `s3_client.py` instead, and deleted `supabase_client.py`.
4. Verified locally end-to-end: uploaded a test file directly through
   `s3_client.py` and confirmed it's publicly downloadable via its S3
   URL.

Still outstanding: if you have real files already stored in Supabase
Storage from before this change, they are not automatically migrated —
copy them over with a one-off script (similar to
`backend/scripts/migrate_webp_images.py`) and update the URLs saved in
the database.

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

## Part 2: Create the S3 bucket for file storage ✅ Done

This bucket stores product images, chat images, and chat files.

**Region choice:** since AK Textiles' customers and servers are in
India, use **Asia Pacific (Mumbai) `ap-south-1`** for every AWS
resource (bucket, EC2, etc.) — this gives the lowest latency. Note: an
S3 bucket's region can never be changed after creation — if you ever
need to move it, you must create a new bucket in the right region, copy
the files over, and delete the old one.

Current setup:
- Bucket name: `ak-textile-s3`
- Region: `ap-south-1` (Mumbai)
- Folders (prefixes): `product-images/`, `chat-images/`, `chat-files/`
  (S3 doesn't have real folders — these are created automatically by
  the app when it uploads a file, but you can also create them manually
  for clarity)

Steps followed:
1. Go to **S3** → **Create bucket**, name it, region `ap-south-1`.
2. **Uncheck** "Block all public access" (needed so product/chat images
   load directly in the browser).
3. Add a bucket policy allowing public `s3:GetObject` (read-only), e.g.:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::ak-textile-s3/*"
       }
     ]
   }
   ```
   (Get this exact "Policy has invalid resource" error if the bucket
   name in the JSON doesn't exactly match your real bucket name.)
4. Created a separate IAM user (`ak-textiles-backend`) just for the
   backend — not the admin user. Its permission policy allows
   `PutObject` / `GetObject` on this bucket only, referencing it by
   ARN (`arn:aws:s3:::ak-textile-s3` and `arn:aws:s3:::ak-textile-s3/*`).
   Its access key and secret key go into the backend's `.env` file as
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

   **Gotcha hit during setup:** if you rename or recreate the bucket,
   the IAM user's policy ARNs must be updated to the new bucket name too
   — otherwise uploads fail with `AccessDenied: not authorized to
   perform s3:PutObject`, even though the bucket policy itself looks
   correct.
5. Verified working: uploaded a test file via the backend's S3 client
   and confirmed it's publicly downloadable (`200 OK`) at
   `https://ak-textile-s3.s3.ap-south-1.amazonaws.com/product-images/...`.

---

## Part 3: Launch the EC2 server for the backend

### Step 1: Open the EC2 console

1. Log in to https://console.aws.amazon.com
2. In the top search bar, type **EC2** and click it.
3. Make sure you're in **Asia Pacific (Mumbai) `ap-south-1`** (top-right
   corner) — same region as the S3 bucket, and closest to both you and
   your customers in India. Region selection is per-service-view, not
   account-wide, so double check it every time before creating a new
   resource.

### Step 2: Launch instance

1. Click the orange **Launch instance** button.
2. **Name**: type `ak-textiles-backend`.

### Step 3: Choose an OS image (AMI)

1. Under **Application and OS Images**, make sure **Ubuntu** is
   selected.
2. In the dropdown below it, choose **Ubuntu Server 22.04 LTS** (should
   be the default, free-tier eligible).

### Step 4: Choose instance type

1. Under **Instance type**, select `t3.small`.
   - If you want to test cheaply first, `t2.micro` / `t3.micro`
     (free-tier eligible) also works for a low-traffic backend, you can
     resize later.

### Step 5: Create a key pair (for SSH access)

1. Under **Key pair (login)**, click **Create new key pair**.
2. Name it `ak-textiles-key`.
3. Key pair type: **RSA**.
4. Private key file format: **.pem** (if you're on Mac/Linux — use
   `.ppk` only if you're using PuTTY on old Windows).
5. Click **Create key pair** — it downloads automatically. **Save this
   file somewhere safe, you cannot download it again.**
6. On your Mac, tighten its permissions so SSH doesn't complain later:
   ```bash
   chmod 400 ~/Downloads/ak-textiles-key.pem
   ```

### Step 6: Network settings (firewall / security group)

1. Under **Network settings**, click **Edit**.
2. Leave the VPC and Subnet as default.
3. Under **Firewall (security groups)**, choose **Create security
   group**.
4. Name it `ak-textiles-backend-sg`.
5. You'll see one rule already there for SSH (port 22). Set **Source
   type** to **My IP** so only your current IP can SSH in (more secure
   than "Anywhere").
6. Click **Add security group rule** twice to add:
   - Type: **HTTP**, Port `80`, Source: **Anywhere (0.0.0.0/0)**
   - Type: **HTTPS**, Port `443`, Source: **Anywhere (0.0.0.0/0)**

### Step 7: Storage

1. Default **8 GB gp3** is fine to start. You can bump it to 15-20 GB if
   you want more headroom — cheap either way.

### Step 8: Launch

1. Review the summary panel on the right.
2. Click **Launch instance**.
3. Click **View all instances** to go back to the instance list.
4. Wait until **Instance state** shows **Running** and **Status check**
   shows **2/2 checks passed** (takes ~1-2 minutes).

### Step 9: Allocate an Elastic IP (so the address never changes)

1. In the left sidebar, under **Network & Security**, click **Elastic
   IPs**.
2. Click **Allocate Elastic IP address** → **Allocate**.
3. Select the new Elastic IP → **Actions** → **Associate Elastic IP
   address**.
4. Choose your `ak-textiles-backend` instance → **Associate**.
5. Note this IP address down — this is your permanent server address
   (e.g. `13.51.xxx.xxx`).

### Step 10: Connect to it

From your terminal:
```bash
ssh -i ~/Downloads/ak-textiles-key.pem ubuntu@YOUR_ELASTIC_IP
```

If it connects and you get an `ubuntu@ip-...` prompt, you're in — the
server is live.

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

### Put Nginx in front (reverse proxy, and now also serving the frontend)

Nginx receives all public traffic on port 80. It serves the frontend's
built static files directly, and forwards API/WebSocket requests to the
backend running on `127.0.0.1:8000`. (Once you have a domain, HTTPS via
Certbot can be added on top of this same config — see the note at the
end of Part 5.)

Create `/etc/nginx/sites-available/ak-backend` (replace
`13.126.206.134` with your own Elastic IP, or your domain once you have
one):
```nginx
server {
    listen 80;
    server_name 13.126.206.134;

    root /var/www/ak-textiles-frontend;
    index index.html;

    # Known backend API + WebSocket route prefixes go to FastAPI.
    # Check backend/app/api/*.py and backend/app/websocket/*.py if new
    # top-level route prefixes are added later — this list needs to stay
    # in sync with them.
    location ~ ^/(auth|broadcasts|chats|groups|products|users|api|ws|health)(/|$) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Everything else is the React app. try_files falls back to
    # index.html so client-side routing (React Router) works on refresh.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:
```bash
sudo ln -sf /etc/nginx/sites-available/ak-backend /etc/nginx/sites-enabled/ak-backend
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Important — file ownership/permissions gotcha:** Nginx runs as the
`www-data` user, which cannot read into `/home/ubuntu` (its permissions
block other users by default). The frontend build files must live
somewhere `www-data` can reach, e.g. `/var/www/ak-textiles-frontend`,
owned by `www-data`:
```bash
sudo mkdir -p /var/www/ak-textiles-frontend
sudo chown -R www-data:www-data /var/www/ak-textiles-frontend
sudo find /var/www/ak-textiles-frontend -type d -exec chmod 755 {} \;
sudo find /var/www/ak-textiles-frontend -type f -exec chmod 644 {} \;
```
If you skip this, requests fail with a `500` error and the Nginx error
log (`sudo tail /var/log/nginx/error.log`) shows `Permission denied`.

---

## Part 4: Point your domain at AWS

1. Buy a domain (Route 53, GoDaddy, Namecheap — any registrar works).
2. Create two DNS records:
   - `api.yourdomain.com` → **A record** pointing to the EC2 Elastic IP.
   - `yourdomain.com` (or `www.yourdomain.com`) → will point to
     CloudFront (set up in the next part).

---

## Part 5: Build and host the frontend ✅ Done (served from EC2, not S3 + CloudFront)

Since there's no domain yet, the frontend is served directly from the
same EC2 instance via Nginx (see Part 3's Nginx config above), instead
of the original S3 + CloudFront plan. This means the frontend and API
share the same origin (`http://13.126.206.134`), so there's no CORS
issue and no extra AWS services to manage for now.

### Build the frontend

On your own machine:
```bash
cd frontend
```
Set `frontend/.env` to point at the server (same IP for both, since
Nginx handles routing — no separate API subdomain needed here):
```
VITE_API_BASE_URL=http://13.126.206.134
```
Then build:
```bash
npm install
npm run build
```
This creates a `dist/` folder with the static website files.

### Ship the build to the server

From your machine, package and copy the build up, then unpack it into
the path Nginx serves from:
```bash
tar -czf frontend-dist.tar.gz -C frontend/dist .
scp -i ~/path/to/ak-textiles-key.pem frontend-dist.tar.gz ubuntu@13.126.206.134:~/frontend-dist.tar.gz
ssh -i ~/path/to/ak-textiles-key.pem ubuntu@13.126.206.134 "\
  sudo mkdir -p /var/www/ak-textiles-frontend && \
  sudo tar -xzf ~/frontend-dist.tar.gz -C /var/www/ak-textiles-frontend && \
  sudo chown -R www-data:www-data /var/www/ak-textiles-frontend && \
  sudo find /var/www/ak-textiles-frontend -type d -exec chmod 755 {} \; && \
  sudo find /var/www/ak-textiles-frontend -type f -exec chmod 644 {} \; && \
  rm ~/frontend-dist.tar.gz"
```

**Gotcha hit during setup:** if you're packing the tarball on a Mac,
`tar` includes hidden `._*` AppleDouble metadata files for every real
file (from `LIBARCHIVE.xattr.com.apple.provenance` extended
attributes). They're harmless but messy — clean them up on the server
with:
```bash
find /var/www/ak-textiles-frontend -name '._*' -delete
```

### Redeploying the frontend later

Whenever you make frontend changes, rebuild and re-run the same
`tar` + `scp` + `ssh` steps above to replace the files.

### Optional: move to S3 + CloudFront later

Once you have a real domain, you can still move the frontend to S3 +
CloudFront for CDN caching and separate scaling from the backend — the
original plan for that is straightforward: create a private S3 bucket,
`aws s3 sync` the `dist/` folder to it, then create a CloudFront
distribution in front of it with an Origin Access Control, a custom
error response redirecting `403`/`404` to `/index.html` (required for
React Router), and an ACM certificate (created in `us-east-1` for
CloudFront) for your domain.

---

## Part 6: Final checklist

### Current state (IP-based, no domain yet) ✅

- [x] `backend/.env` on EC2 has production values (fresh `JWT_SECRET`,
      real S3 bucket, real Neon `DATABASE_URL`)
- [x] `alembic upgrade head` has been run against the Neon database
- [x] Backend responds at `http://13.126.206.134/health`
- [x] Frontend loads at `http://13.126.206.134` (served by Nginx from
      `/var/www/ak-textiles-frontend`)
- [x] Elastic IP is attached (server IP won't change on reboot)
- [x] `ak-backend` systemd service is enabled (restarts on crash/reboot)
- [ ] Uploading a product image works and the image loads from S3 —
      test this once you exercise the upload flow in the app
- [ ] Chat (WebSocket) works over `ws://13.126.206.134/ws/chat` — test
      via the app's chat feature

### Once you have a domain, before calling it "live"

- [ ] Point domain DNS at the Elastic IP (Part 4)
- [ ] Add HTTPS with Certbot (`sudo certbot --nginx -d yourdomain.com`)
- [ ] Update `backend/.env`: `CORS_ORIGINS` and `FRONTEND_BASE_URL` to
      the real `https://yourdomain.com`
- [ ] Rebuild frontend with `VITE_API_BASE_URL=https://yourdomain.com`
      and redeploy
- [ ] Restart `ak-backend` after any `.env` change
      (`sudo systemctl restart ak-backend`)

---

## Part 7: Ongoing maintenance

- **Backend updates**: SSH into EC2, `git pull`, reinstall
  requirements if changed, run new migrations, then
  `sudo systemctl restart ak-backend`.
- **Frontend updates**: rebuild locally and re-run the `tar` + `scp` +
  `ssh` steps from Part 5 to replace the files in
  `/var/www/ak-textiles-frontend`.
- **Database**: stays fully managed by Neon — no server maintenance
  needed on your side.
- **Costs to expect roughly**: EC2 `t3.small` (~$15/month), S3 storage
  (a few dollars, based on usage), Elastic IP (free while attached to a
  running instance). No CloudFront cost for now since it's not in use.
