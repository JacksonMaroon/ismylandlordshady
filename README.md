# IsMyLandlordShady.nyc

A transparency platform for NYC building and landlord data, aggregating violations, complaints, evictions, and owner portfolios from NYC Open Data.

## Tech Stack

- **Backend**: FastAPI + PostgreSQL/PostGIS + SQLAlchemy
- **Frontend**: Next.js 14 + Tailwind CSS + React Query
- **Data Pipeline**: Async extractors for NYC Open Data (Socrata API)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Development Setup

1. **Start the database:**
   ```bash
   docker-compose up -d db
   ```

2. **Set up backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your Socrata app token
   ```

3. **Run data pipeline (initial load):**
   ```bash
   python -m pipeline.runner --dataset all --entity-resolution --scoring
   ```

4. **Start backend API:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Set up frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Open http://localhost:3000**

## Project Structure

```
ismylandlordshady/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI routes
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── pipeline/
│   │   ├── extractors/      # Data source ETL
│   │   └── runner.py        # Pipeline orchestrator
│   └── alembic/             # Database migrations
├── frontend/
│   └── src/
│       ├── app/             # Next.js pages
│       ├── components/      # React components
│       └── lib/             # API client, utilities
└── docker-compose.yml
```

## Data Sources

| Dataset | Records | Description |
|---------|---------|-------------|
| HPD Violations | ~6M | Housing violations by class (A/B/C) |
| HPD Registrations | ~250K | Building registrations |
| Registration Contacts | ~1M | Owner/agent contact info |
| 311 Complaints | ~5M | Housing-related complaints |
| DOB Violations | ~2M | Building code violations |
| Evictions | ~100K | Eviction filings |

## Scoring System

Buildings are scored on a 0-100 scale (higher = worse):

- **Violations (30%)**: Class C=10pts, B=5pts, A=1pt per unit
- **Complaints (20%)**: 311 complaints per unit × 20
- **Evictions (25%)**: Eviction filings per unit × 50
- **Ownership (15%)**: LLC usage + portfolio size flags
- **Resolution (10%)**: Days to resolve vs city average

**Grades**: A (0-19), B (20-39), C (40-59), D (60-79), F (80-100)

## API Endpoints

- `GET /api/v1/buildings/search?q=` - Address autocomplete
- `GET /api/v1/buildings/{bbl}` - Full building report
- `GET /api/v1/buildings/{bbl}/violations` - Paginated violations
- `GET /api/v1/buildings/{bbl}/timeline` - Combined timeline
- `GET /api/v1/owners/{id}` - Owner portfolio
- `GET /api/v1/leaderboards/worst-buildings` - Building rankings
- `GET /api/v1/leaderboards/worst-landlords` - Landlord rankings

## Pipeline Commands

```bash
# Extract specific dataset
python -m pipeline.runner --dataset hpd_violations

# Full refresh (truncate and reload)
python -m pipeline.runner --dataset all --full-refresh

# Run entity resolution
python -m pipeline.runner --entity-resolution

# Compute scores
python -m pipeline.runner --scoring
```

## Deployment

### Backend (Railway)

```bash
# railway.toml is configured for auto-deploy
railway up
```

### Frontend (Vercel)

```bash
cd frontend
vercel
```

## License

MIT
