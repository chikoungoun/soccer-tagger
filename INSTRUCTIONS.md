# Soccer Team Manager - Setup Instructions

## Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python sample_data.py  # Optional: Load sample data
uvicorn main:app --reload
```

The API will be available at:
- http://localhost:8000 (main API)
- http://localhost:8000/docs (interactive documentation)

### 2. Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

The application will be available at: http://localhost:3000

## Features

### Teams Management
- ✅ Create, edit, and delete teams
- ✅ Add team details (name, logo, stadium, founded year, description)
- ✅ View team roster with players organized by position

### Players Management
- ✅ Add players to teams with jersey numbers and positions
- ✅ Search and filter players by team, position, and status
- ✅ Manage player details (age, nationality, photo)
- ✅ Position-based organization (GK, DF, MF, FW)

### Fixtures & Scoring
- ✅ Schedule matches between teams
- ✅ Real-time score updates
- ✅ Match status tracking (scheduled, live, completed)
- ✅ Filter fixtures by status and team

### Design Features
- ✅ Responsive design (mobile-friendly)
- ✅ Soccer-themed color scheme
- ✅ Professional UI with Tailwind CSS
- ✅ Mobile navigation bar
- ✅ Dashboard with statistics

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create new team
- `GET /api/teams/{id}` - Get team with players
- `PUT /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team

### Players
- `GET /api/players` - List all players (optional: filter by team)
- `POST /api/players` - Create new player
- `GET /api/players/{id}` - Get player details
- `PUT /api/players/{id}` - Update player
- `DELETE /api/players/{id}` - Delete player

### Fixtures
- `GET /api/fixtures` - List all fixtures (optional: filter by team/status)
- `POST /api/fixtures` - Create new fixture
- `GET /api/fixtures/{id}` - Get fixture details
- `PUT /api/fixtures/{id}` - Update fixture
- `PATCH /api/fixtures/{id}/score` - Update match score
- `PATCH /api/fixtures/{id}/complete` - Mark match as completed
- `DELETE /api/fixtures/{id}` - Delete fixture

## Sample Data

The application includes sample data with 4 teams (Manchester United, Arsenal, Liverpool, Chelsea), 16 players, and 6 fixtures demonstrating all match states.

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic
- **Frontend**: React, TypeScript, Tailwind CSS, React Router, Axios
- **Build Tools**: Vite, PostCSS, Autoprefixer

## Project Structure

```
soccer-manager/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── sample_data.py       # Sample data generator
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── teams.py         # Team endpoints
│       ├── players.py       # Player endpoints
│       └── fixtures.py      # Fixture endpoints
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # API utilities
│   │   └── App.tsx         # Main app component
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── README.md
```

## Responsive Design

The application is fully responsive with:
- Desktop: Sidebar navigation
- Mobile: Bottom navigation bar
- Adaptive grid layouts
- Touch-friendly interface elements

## Development Notes

- The backend uses SQLite for simplicity but can be easily switched to PostgreSQL or MySQL
- Frontend uses Vite for fast development and building
- API includes CORS configuration for development
- All forms include validation and error handling
- The application follows REST API conventions