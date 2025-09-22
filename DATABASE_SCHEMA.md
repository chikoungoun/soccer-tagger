# Soccer Manager Database Schema

This document describes the database structure and relationships for the Soccer Manager application.

## Database Overview

The database consists of **8 main tables** that handle user management, team/player data, match scheduling, lineups, events, and match timing.

## Tables and Relationships

### 1. **users** (User Management)
```sql
users {
  id                INTEGER PRIMARY KEY
  username          VARCHAR(50) UNIQUE NOT NULL
  email             VARCHAR(100) UNIQUE NOT NULL
  hashed_password   VARCHAR(255) NOT NULL
  role              VARCHAR(20) DEFAULT 'tagger'  -- 'super_admin' or 'tagger'
  is_active         BOOLEAN DEFAULT TRUE
  created_at        DATETIME DEFAULT NOW()
  updated_at        DATETIME ON UPDATE NOW()
}
```
**Purpose**: Stores user accounts with role-based access control
**Relationships**: Standalone table (no foreign keys)

---

### 2. **teams** (Team Management)
```sql
teams {
  id               INTEGER PRIMARY KEY
  name             VARCHAR(100) UNIQUE NOT NULL
  logo_url         VARCHAR(255)
  founded_year     INTEGER
  stadium          VARCHAR(100)
  description      TEXT
  created_at       DATETIME DEFAULT NOW()
  updated_at       DATETIME ON UPDATE NOW()
}
```
**Purpose**: Stores team information and metadata
**Relationships**:
- **1:N** with `players` (one team has many players)
- **1:N** with `fixtures` as home team
- **1:N** with `fixtures` as away team
- **1:N** with `lineups` (team lineups for matches)

---

### 3. **players** (Player Management)
```sql
players {
  id              INTEGER PRIMARY KEY
  name            VARCHAR(100) NOT NULL
  jersey_number   INTEGER NOT NULL
  position        VARCHAR(50) NOT NULL    -- GK, DF, MF, FW
  age             INTEGER
  birth_date      DATE
  nationality     VARCHAR(50)
  photo_url       VARCHAR(255)
  team_id         INTEGER FOREIGN KEY → teams.id
  is_active       BOOLEAN DEFAULT TRUE
  created_at      DATETIME DEFAULT NOW()
  updated_at      DATETIME ON UPDATE NOW()
}
```
**Purpose**: Stores individual player information
**Relationships**:
- **N:1** with `teams` (many players belong to one team)
- **1:N** with `lineups` (player can be in multiple match lineups)
- **1:N** with `match_events` (player can have multiple events)

---

### 4. **gameweeks** (Schedule Management)
```sql
gameweeks {
  id            INTEGER PRIMARY KEY
  week_number   INTEGER NOT NULL
  name          VARCHAR(100) NOT NULL     -- "Gameweek 1", "Week 1"
  start_date    DATE NOT NULL
  end_date      DATE NOT NULL
  is_active     BOOLEAN DEFAULT FALSE
  created_at    DATETIME DEFAULT NOW()
  updated_at    DATETIME ON UPDATE NOW()
}
```
**Purpose**: Groups matches into weekly/periodic rounds
**Relationships**:
- **1:N** with `fixtures` (one gameweek contains multiple fixtures)

---

### 5. **fixtures** (Match Scheduling)
```sql
fixtures {
  id              INTEGER PRIMARY KEY
  gameweek_id     INTEGER FOREIGN KEY → gameweeks.id    -- Optional
  home_team_id    INTEGER FOREIGN KEY → teams.id
  away_team_id    INTEGER FOREIGN KEY → teams.id
  match_date      DATETIME NOT NULL
  venue           VARCHAR(100)
  status          VARCHAR(20) DEFAULT 'scheduled'        -- scheduled, live, completed, cancelled
  home_score      INTEGER DEFAULT 0
  away_score      INTEGER DEFAULT 0
  created_at      DATETIME DEFAULT NOW()
  updated_at      DATETIME ON UPDATE NOW()
}
```
**Purpose**: Central match/fixture management with scores
**Relationships**:
- **N:1** with `gameweeks` (many fixtures in one gameweek)
- **N:1** with `teams` as home team
- **N:1** with `teams` as away team
- **1:N** with `lineups` (one fixture has multiple lineup entries)
- **1:N** with `match_events` (one fixture has multiple events)
- **1:1** with `match_timers` (one fixture has one timer)

---

### 6. **lineups** (Team Sheet Management)
```sql
lineups {
  id              INTEGER PRIMARY KEY
  fixture_id      INTEGER FOREIGN KEY → fixtures.id
  team_id         INTEGER FOREIGN KEY → teams.id
  player_id       INTEGER FOREIGN KEY → players.id
  is_starter      BOOLEAN DEFAULT TRUE               -- TRUE = Starting XI, FALSE = Substitute
  position_played VARCHAR(50)                        -- Position for this match
  minutes_played  INTEGER DEFAULT 0                  -- Total minutes played
  created_at      DATETIME DEFAULT NOW()
  updated_at      DATETIME ON UPDATE NOW()
}
```
**Purpose**: Manages team lineups for each match with minutes tracking
**Relationships**:
- **N:1** with `fixtures` (many lineup entries per fixture)
- **N:1** with `teams` (lineup belongs to one team)
- **N:1** with `players` (lineup entry for one player)

---

### 7. **match_events** (Live Match Events)
```sql
match_events {
  id            INTEGER PRIMARY KEY
  fixture_id    INTEGER FOREIGN KEY → fixtures.id
  player_id     INTEGER FOREIGN KEY → players.id
  event_type    VARCHAR(50) NOT NULL              -- goal, yellow_card, red_card, substitution_in, substitution_out, penalty_miss, penalty_saved
  minute        INTEGER NOT NULL                  -- Minute of event (1-90+)
  half          INTEGER NOT NULL                  -- 1 = first half, 2 = second half
  extra_info    TEXT                              -- Additional details
  created_at    DATETIME DEFAULT NOW()
}
```
**Purpose**: Records all match events for live tracking and statistics
**Relationships**:
- **N:1** with `fixtures` (many events per fixture)
- **N:1** with `players` (many events per player)

---

### 8. **match_timers** (Live Match Timing)
```sql
match_timers {
  id                    INTEGER PRIMARY KEY
  fixture_id            INTEGER FOREIGN KEY → fixtures.id UNIQUE
  current_half          INTEGER DEFAULT 0               -- 0=not started, 1=first half, 2=second half, 3=finished
  half_start_time       DATETIME                        -- When current half started
  is_paused             BOOLEAN DEFAULT FALSE
  pause_time            DATETIME                        -- When timer was paused
  total_pause_duration  INTEGER DEFAULT 0               -- Total pause time in seconds
  created_at            DATETIME DEFAULT NOW()
  updated_at            DATETIME ON UPDATE NOW()
}
```
**Purpose**: Manages live match timing for accurate minute calculations
**Relationships**:
- **1:1** with `fixtures` (one timer per fixture)

---

## Entity Relationship Diagram

```
                    ┌─────────────┐
                    │    users    │
                    │             │
                    └─────────────┘
                           │
                           │ (no relationships)
                           │
    ┌─────────────┐       │       ┌─────────────────┐
    │   teams     │◄──────┼──────►│   gameweeks     │
    │             │       │       │                 │
    └─────┬───────┘       │       └─────┬───────────┘
          │               │             │
          │ 1:N           │             │ 1:N
          ▼               │             ▼
    ┌─────────────┐       │       ┌─────────────────┐
    │   players   │       │       │    fixtures     │◄─────┐
    │             │       │       │                 │      │
    └─────┬───────┘       │       └─────┬───────────┘      │
          │               │             │                  │
          │ 1:N           │             │ 1:N              │ 1:1
          │               │             ▼                  │
          │               │       ┌─────────────────┐      │
          │               │       │    lineups      │      │
          │               │       │                 │      │
          │               │       └─────────────────┘      │
          │               │             │                  │
          │               │             │ N:1              │
          │               │             │                  ▼
          │               │       ┌─────▼───────────┐ ┌─────────────────┐
          └───────────────┼──────►│  match_events   │ │  match_timers   │
                          │       │                 │ │                 │
                          │       └─────────────────┘ └─────────────────┘
                          │
                          │
                    (Authentication)
```

## Key Business Rules

### **Automatic Score Calculation**
- Goals in `match_events` automatically update `fixtures.home_score` and `fixtures.away_score`
- Score decrements when goal events are deleted
- Score adjustments when goal events are modified

### **Player Minutes Calculation**
- Automatically calculated based on:
  - Match timer (`match_timers`)
  - Substitution events (`match_events`)
  - Red card events (stops minute counting)
  - Two-half structure (45 minutes each)
- Recalculated on every event create/update/delete

### **Match State Management**
- `fixtures.status`: `scheduled` → `live` → `completed`
- `match_timers.current_half`: `0` (not started) → `1` (first half) → `-1` (halftime) → `2` (second half) → `3` (finished)

### **Lineup Management**
- `lineups.is_starter`: `TRUE` = Starting XI, `FALSE` = Substitute
- Red card events automatically remove players from lineups
- Substitution events manage player on/off field status

### **User Roles**
- `super_admin`: Full system access
- `tagger`: Can manage events and lineups
- Authentication required for data modifications

## Indexes and Constraints

### **Primary Keys**: All tables have auto-incrementing integer primary keys
### **Unique Constraints**:
- `users.username`, `users.email`
- `teams.name`
- `match_timers.fixture_id` (one timer per fixture)

### **Foreign Key Constraints**: All relationships enforced at database level
### **Cascading Deletes**:
- Deleting teams cascades to players
- Deleting fixtures cascades to lineups, events, and timers
- Deleting gameweeks cascades to fixtures

This schema supports a complete soccer management system with live match tracking, event management, automated scoring, and comprehensive player statistics.