# How to Redeploy AK Textiles (Frontend + Backend)

This guide is for anyone who needs to push new code to the live server.
It assumes you already have the `.pem` key file (ask a teammate for it
if you don't) and that the server is already set up (see
`AWS_DEPLOYMENT_PLAN.md` for how it was originally built).

You do not need to know AWS to follow this — just your terminal.

## What you need before starting

1. **The `.pem` key file** (e.g. `ak-textiles-key.pem`). This is how you
   log into the server. Treat it like a password — don't share it in
   Slack/email, don't commit it to git.
2. **The server's IP address**. As of writing this: `13.126.206.134`
   (ask a teammate if this has changed — it shouldn't, since it's an
   Elastic IP, but double check).
3. Git access to this repository, and the code checked out locally on
   your own machine.

## One-time setup (only needed the first time on your machine)

Put the `.pem` file somewhere on your machine and lock down its
permissions (SSH refuses to use it otherwise):

```bash
chmod 400 /path/to/ak-textiles-key.pem
```

Everywhere below, replace `/path/to/ak-textiles-key.pem` with the real
path on your machine, and `13.126.206.134` with the real server IP.

---

## Quick way: use the deploy scripts

The repo has two scripts under `deploy/` that do everything for you —
this is the recommended way to deploy once you're set up. Run them from
your own machine, from the repo root:

```bash
./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
./deploy/deploy-frontend.sh /path/to/ak-textiles-key.pem
```

- `deploy-backend.sh` — SSHes into the server, pulls the latest
  `master`, installs any new Python dependencies, runs database
  migrations, restarts the `ak-backend` service, and checks
  `/health`.
- `deploy-frontend.sh` — builds the frontend locally, packages it,
  copies it to the server, and unpacks it into
  `/var/www/ak-textiles-frontend` with the right ownership/permissions.

Both scripts default to server IP `13.126.206.134` and user `ubuntu`.
You can override these with environment variables if the server ever
changes, e.g.:
```bash
SERVER_IP=1.2.3.4 ./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
```

The rest of this document explains what those scripts actually do,
step by step — useful if something goes wrong and you need to run a
step manually, or if you're doing something the scripts don't cover
(like a one-off command on the server).

---

## Redeploying the backend (manual steps)

The backend is a FastAPI app running on the server as a **systemd
service** called `ak-backend`. It's already set up to auto-restart if
it crashes. To push new code:

### 1. Make sure your changes are merged and pushed

Your changes need to be committed and pushed to whichever branch the
server tracks (currently `master`) before the server can pull them.

### 2. SSH into the server and pull the latest code

```bash
ssh -i /path/to/ak-textiles-key.pem ubuntu@13.126.206.134
cd ~/ak-textiles
git pull origin master
```

### 3. Install any new Python dependencies

Only needed if `backend/requirements.txt` changed, but it's safe (and
fast) to run every time:

```bash
cd ~/ak-textiles/backend
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run any new database migrations

Only needed if new files appear under `backend/alembic/versions/`, but
again, safe to run every time — it does nothing if there's nothing new:

```bash
alembic upgrade head
```

### 5. Restart the backend service

```bash
sudo systemctl restart ak-backend
```

### 6. Confirm it worked

```bash
sudo systemctl status ak-backend --no-pager
curl http://localhost:8000/health
```

You should see `active (running)` and `{"status":"ok"}`. If not, check
the logs:

```bash
sudo journalctl -u ak-backend -n 50 --no-pager
```

### All backend steps in one block

Once you're comfortable with the individual steps, here they are
together (run this after SSH-ing in):

```bash
cd ~/ak-textiles && \
git pull origin master && \
cd backend && \
source venv/bin/activate && \
pip install -r requirements.txt && \
alembic upgrade head && \
sudo systemctl restart ak-backend && \
sudo systemctl status ak-backend --no-pager
```

---

## Redeploying the frontend (manual steps)

The frontend is a React app. Unlike the backend, it's **built into
static files on your own machine**, then copied up to the server —
the server doesn't run any frontend build step itself. Nginx (already
running on the server) just serves whatever files are in
`/var/www/ak-textiles-frontend`.

Do these steps from **your own machine**, not on the server.

### 1. Make sure `frontend/.env` points at the server

```bash
cat frontend/.env
```
It should show:
```
VITE_API_BASE_URL=http://13.126.206.134
```
If it's missing or wrong, fix it before building — this value gets
baked into the build, it can't be changed afterwards without
rebuilding.

### 2. Install dependencies and build

```bash
cd frontend
npm install
npm run build
```
This creates a `frontend/dist/` folder with the finished static files.

### 3. Package the build and copy it to the server

```bash
tar -czf /tmp/frontend-dist.tar.gz -C dist .
scp -i /path/to/ak-textiles-key.pem /tmp/frontend-dist.tar.gz ubuntu@13.126.206.134:~/frontend-dist.tar.gz
```

### 4. Unpack it into place on the server

```bash
ssh -i /path/to/ak-textiles-key.pem ubuntu@13.126.206.134 "\
  sudo rm -rf /var/www/ak-textiles-frontend/* && \
  sudo tar -xzf ~/frontend-dist.tar.gz -C /var/www/ak-textiles-frontend && \
  sudo find /var/www/ak-textiles-frontend -name '._*' -delete && \
  sudo chown -R www-data:www-data /var/www/ak-textiles-frontend && \
  sudo find /var/www/ak-textiles-frontend -type d -exec chmod 755 {} \; && \
  sudo find /var/www/ak-textiles-frontend -type f -exec chmod 644 {} \; && \
  rm ~/frontend-dist.tar.gz"
```

A quick note on that middle step (`find ... -name '._*' -delete`): if
you're on a Mac, `tar` sometimes bundles in hidden junk files
(`._filename`) alongside your real files. They're harmless, but this
cleans them up so they don't clutter the server.

### 5. Confirm it worked

```bash
curl -o /dev/null -s -w "%{http_code}\n" http://13.126.206.134/
```
Should print `200`. Or just open `http://13.126.206.134` in a browser
and check the change is there.

### All frontend steps in one block

From your own machine, inside the repo:

```bash
cd frontend && \
npm install && \
npm run build && \
tar -czf /tmp/frontend-dist.tar.gz -C dist . && \
scp -i /path/to/ak-textiles-key.pem /tmp/frontend-dist.tar.gz ubuntu@13.126.206.134:~/frontend-dist.tar.gz && \
ssh -i /path/to/ak-textiles-key.pem ubuntu@13.126.206.134 "\
  sudo rm -rf /var/www/ak-textiles-frontend/* && \
  sudo tar -xzf ~/frontend-dist.tar.gz -C /var/www/ak-textiles-frontend && \
  sudo find /var/www/ak-textiles-frontend -name '._*' -delete && \
  sudo chown -R www-data:www-data /var/www/ak-textiles-frontend && \
  sudo find /var/www/ak-textiles-frontend -type d -exec chmod 755 {} \; && \
  sudo find /var/www/ak-textiles-frontend -type f -exec chmod 644 {} \; && \
  rm ~/frontend-dist.tar.gz"
```

---

## Troubleshooting

**"Permission denied (publickey)" when SSH-ing in**
The `.pem` file's permissions are too open. Run
`chmod 400 /path/to/ak-textiles-key.pem` and try again.

**Backend won't start after restart**
Check the logs: `sudo journalctl -u ak-backend -n 100 --no-pager`.
Common causes: a typo in `backend/.env`, a missing new environment
variable a recent code change needs, or a Python package that failed
to install (re-run `pip install -r requirements.txt` and read the
error).

**Frontend shows old content after deploying**
Your browser may have cached the old page. Hard refresh
(Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux) or open in an
incognito window to confirm.

**Frontend shows a `500` or blank page, Nginx error log mentions
"Permission denied"**
The files in `/var/www/ak-textiles-frontend` aren't owned by
`www-data`. Re-run the `chown`/`chmod` commands from Step 4 above.

**"Can't locate revision identified by ..." when running `alembic
upgrade head`**
This means the server's checked-out branch doesn't have a migration
file that the database already expects (usually because the database
already had a newer migration applied from someone's local machine, but
the server hasn't pulled that commit yet). Make sure you ran
`git pull origin master` before running migrations.

---

## Where things live on the server (quick reference)

| What | Where |
|---|---|
| Backend code | `~/ak-textiles/backend` |
| Backend Python virtual environment | `~/ak-textiles/backend/venv` |
| Backend environment variables | `~/ak-textiles/backend/.env` |
| Backend systemd service | `ak-backend` (`sudo systemctl ... ak-backend`) |
| Backend logs | `sudo journalctl -u ak-backend` |
| Frontend static files (served by Nginx) | `/var/www/ak-textiles-frontend` |
| Nginx site config | `/etc/nginx/sites-available/ak-backend` |
| Nginx logs | `/var/log/nginx/error.log`, `/var/log/nginx/access.log` |
