# Soccer Manager Application

A comprehensive web application for managing soccer teams, players, fixtures, and live match events.

## 🚀 Features

### Team & Player Management
- **Team Management**: Create, edit, and delete teams with logos, stadiums, and descriptions
- **Player Management**: Add players with detailed profiles (birth dates, positions, nationalities)
- **Player Population Script**: Automated script to populate teams with 20 players each
- **180 Total Players**: 9 teams × 20 players with realistic data

### Match & Fixture Management
- **Fixture Scheduling**: Create matches between teams with venues and dates
- **Gameweek System**: Organize fixtures into gameweeks for tournament structure
- **Live Match Timer**: Real-time match timing with pause/resume functionality
- **Score Management**: Update scores during live matches

### Advanced Features
- **Lineup Management**: Set starting 11 and substitutes for each team
- **Lineup Status Indicators**: Visual indicators showing which lineups are ready (11 starters)
- **Live Event Tracking**: Record goals, cards, substitutions, and penalties
- **Red Card Automation**: Players automatically removed from lineup after red cards
- **Event History**: Complete timeline of match events with player details
- **Birth Date Integration**: Player ages displayed throughout the application

### User Interface
- **Dashboard**: Overview with team/player counts and live match status
- **Responsive Design**: Works on desktop and mobile devices
- **Filter & Search**: Advanced filtering for fixtures, players, and teams
- **URL-based Filtering**: Direct links to filtered views (e.g., live matches)
- **Color-coded UI**: Position-based colors and status indicators

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: SQLite (180 players, 9 teams pre-populated)
- **Icons**: Heroicons React
- **HTTP Client**: Axios

## 📁 Project Structure

```
soccer-manager/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── PlayerModal.tsx
│   │   │   ├── LineupModal.tsx
│   │   │   ├── EditEventModal.tsx
│   │   │   └── ...
│   │   ├── pages/          # Main application pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Players.tsx
│   │   │   ├── Fixtures.tsx
│   │   │   └── MatchCenter.tsx
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # API utilities and helpers
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # FastAPI Python application
│   ├── routers/            # API route handlers
│   │   ├── players.py
│   │   ├── teams.py
│   │   ├── fixtures.py
│   │   ├── events.py
│   │   └── lineups.py
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic schemas for validation
│   ├── database.py         # Database connection setup
│   ├── main.py            # FastAPI application entry point
│   ├── populate_players.py # Script to populate teams with players
│   └── requirements.txt    # Python dependencies
├── README.md
└── .gitignore
```

## 🚦 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Population Script (Optional)
To populate the database with sample data:
```bash
cd backend
python populate_players.py
```

## 🌐 Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## 📊 Database Schema

The application uses SQLite with the following main entities:

- **Teams**: Team information and metadata
- **Players**: Player profiles with birth dates and positions
- **Fixtures**: Match schedules and results
- **Gameweeks**: Tournament organization structure
- **Lineups**: Player assignments for matches (starters/subs)
- **Events**: Match events (goals, cards, substitutions)
- **MatchTimer**: Live match timing information

## 🎯 Key Features in Detail

### Live Match Management
- Start/pause/resume match timer
- Real-time event logging
- Automatic lineup updates (red card removals)
- Score tracking and updates

### Smart Filtering
- Dashboard links directly to filtered fixture views
- URL-based filter parameters
- Status-based filtering (live, completed, scheduled)

### Player Management
- Birth date integration with age calculation
- Position-based color coding (GK=Blue, DF=Yellow, MF=Green, FW=Red)
- Comprehensive search and filtering

### Data Population
- Automated script creates 20 players per team
- Realistic birth dates, names, and nationalities
- Proper position distribution (3 GK, 7 DF, 7 MF, 3 FW)

## 🔧 Development Notes

- Database is automatically created on first run
- Default API pagination limit is 100 (frontend requests 1000 for full data)
- Red card events automatically remove players from active lineups
- Lineup status indicators update in real-time

## 📝 License

This project is developed for educational and demonstration purposes.