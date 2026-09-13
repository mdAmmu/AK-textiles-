# How to Redeploy AK Textiles

Two scripts handle everything — build, copy, restart. You just need the
`.pem` key file (ask a teammate if you don't have it).

## Redeploy the backend

```bash
./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
```

Pulls the latest `master` on the server, installs any new Python
dependencies, runs database migrations, restarts the `ak-backend`
service, and checks `/health`.

## Redeploy the frontend

```bash
./deploy/deploy-frontend.sh /path/to/ak-textiles-key.pem
```

Builds the frontend on your machine, copies it to the server, and puts
it in place for Nginx to serve.

Both scripts default to server IP `13.126.206.134` and user `ubuntu`. If
the server ever changes, override with an environment variable:
```bash
SERVER_IP=1.2.3.4 ./deploy/deploy-backend.sh /path/to/ak-textiles-key.pem
```

---

## Troubleshooting

**"Permission denied (publickey)" when the script SSHes in**
Your `.pem` file's permissions are too open.
```bash
chmod 400 /path/to/ak-textiles-key.pem
```

**Backend deploy succeeds but the service isn't healthy**
Check the logs:
```bash
ssh -i /path/to/ak-textiles-key.pem ubuntu@13.126.206.134 "sudo journalctl -u ak-backend -n 100 --no-pager"
```
Common causes: a typo in `backend/.env` on the server, or a new
environment variable a recent code change needs but the server's
`.env` doesn't have yet.

**Frontend deploy succeeds but the site still looks old**
Your browser cached the old page — hard refresh (Cmd+Shift+R /
Ctrl+Shift+R) or open an incognito window.

**"Can't locate revision identified by ..." during the backend
deploy's migration step**
The server's database already has a migration applied that the
server's checked-out code doesn't have a file for. Usually means the
server didn't actually get the latest `git pull` — check the script's
output for that step.

---

## Where things live on the server

| What | Where |
|---|---|
| Backend code | `~/ak-textiles/backend` |
| Backend `.env` | `~/ak-textiles/backend/.env` |
| Backend service | `ak-backend` (`sudo systemctl ... ak-backend`) |
| Backend logs | `sudo journalctl -u ak-backend` |
| Frontend files (served by Nginx) | `/var/www/ak-textiles-frontend` |
| Nginx config | `/etc/nginx/sites-available/ak-backend` |
| Nginx logs | `/var/log/nginx/error.log` |

Full details on how the server was originally set up (EC2, S3, Nginx
config from scratch) are in `AWS_DEPLOYMENT_PLAN.md`.
