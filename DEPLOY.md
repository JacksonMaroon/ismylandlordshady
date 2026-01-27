# Deployment Guide

## Deploy to Railway (Recommended)

### Web Interface Method:

1. Go to https://railway.app and sign up/login
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect GitHub and select `JacksonMaroon/ismylandlordshady`
5. Railway will auto-detect the backend using `railway.json`
6. Add PostgreSQL database:
   - Click "New" → "Database" → "Add PostgreSQL"
7. Configure environment variables in Railway dashboard:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=
   LOG_LEVEL=INFO
   ```
8. Railway will provide a public URL (e.g., `https://your-app.railway.app`)

### CLI Method (if logged in):

```bash
railway login
railway init
railway add --database postgresql
railway up
```

## Deploy to DigitalOcean (App Platform)

This repo includes an App Platform spec at `digitalocean/app.yaml` that points at the FastAPI backend in `backend/`, and defines a post-deploy migration job.

### Dashboard Method

1. Create a managed PostgreSQL database in DigitalOcean (ideally in NYC).
2. In the database SQL console, enable extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
3. Create a new App Platform app from your GitHub repo.
4. When configuring the service, use:
   Source directory: `backend`.
   Dockerfile path: `Dockerfile`.
   HTTP port: `8000`.
5. Attach your managed PostgreSQL database to the app and name it `db` so `${db.DATABASE_URL}` can be resolved.
6. Configure environment variables in App Platform:
   ```bash
   DATABASE_URL=${db.DATABASE_URL}
   SOCRATA_APP_TOKEN=your_token_here
   ALLOWED_ORIGINS=https://frontend-two-kohl-50.vercel.app,https://your-app.ondigitalocean.app
   LOG_LEVEL=INFO
   ```
7. Deploy the app. The `migrate` job will run `alembic upgrade head` after each deploy.
8. The `pipeline` job is scheduled to run monthly (1st of month at 5:00 AM America/New_York). Edit `digitalocean/app.yaml` if you want a different cadence.

### CLI Method (Optional)

If you use `doctl`, you can deploy from the included spec:

```bash
doctl auth init
doctl apps create --spec digitalocean/app.yaml
doctl apps list
```
This `doctl apps create --spec ...` flow is supported by DigitalOcean’s CLI.

## Deploy to Render

1. Go to https://render.com and sign up/login
2. Click "New" → "Blueprint"
3. Connect GitHub and select `JacksonMaroon/ismylandlordshady`
4. Render will auto-detect `render.yaml` and set everything up
5. Wait for deployment (takes 5-10 minutes)
6. Render will provide a public URL

## After Backend Deployment

Once your backend is deployed, configure the frontend:

1. Set environment variable on Vercel:
   ```bash
   cd frontend
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter your backend URL: https://your-backend.railway.app
   ```

2. Redeploy frontend:
   ```bash
   vercel --prod
   ```

## Database Setup

After deployment, you need to:

1. Run database migrations:
   ```bash
   # SSH into your service or use Railway/Render shell
   cd backend
   alembic upgrade head
   ```

2. Run the data pipeline to populate the database:
   ```bash
   cd backend
   python -m pipeline.runner --extraction --entity-resolution --scoring
   ```

Note: The full pipeline takes ~30 minutes to run. You may want to run it locally first and export/import the database.

## Environment Variables

### Backend (Railway/Render):
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)
- `REDIS_URL` - Optional Redis URL
- `LOG_LEVEL` - Set to `INFO`
- `PORT` - Auto-provided by hosting platform

### Frontend (Vercel):
- `NEXT_PUBLIC_API_URL` - Your backend URL

## Monitoring

- Railway: Check logs in dashboard at https://railway.app
- Render: Check logs in dashboard at https://render.com
- Vercel: Check logs with `vercel logs`
