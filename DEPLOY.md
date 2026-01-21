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
