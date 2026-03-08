# Color Perception SPA

[![Integration Tests](https://github.com/jsrahoi-dev/devops-spring26-midterm-infra/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/jsrahoi-dev/devops-spring26-midterm-infra/actions/workflows/integration-tests.yml)

A Single Page Application for studying color perception across users with different native languages.

## Features

- Language selection for users
- Color classification system (5 colors per session)
- Agreement statistics and results visualization
- Interactive 3D color space exploration using Three.js

## Tech Stack

- **Frontend:** React + Vite, React Three Fiber, Axios
- **Backend:** Node.js + Express, MySQL session store
- **Database:** MySQL 8
- **Containerization:** Docker + docker-compose

## Local Development

### Prerequisites

- Docker and docker-compose installed
- Node.js 20+ (for local development without Docker)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone git@github.com:jsrahoi-dev/devops-spring26-midterm-source.git
   cd devops-spring26-midterm-source
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Visit http://localhost:3000

4. To stop:
   ```bash
   docker-compose down
   ```

### Development without Docker

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL connection details
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## Project Structure

```
├── backend/
│   ├── routes/          # API route handlers
│   ├── db/              # Database schema and seed data
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── Dockerfile           # Multi-stage build
└── docker-compose.yml   # Local development setup
```

## API Endpoints

- `POST /api/language` - Set user's native language
- `GET /api/colors/next` - Get next random color
- `POST /api/responses` - Submit color classification
- `GET /api/results/mine` - Get user's results with agreement stats
- `GET /api/visualize/data` - Get all colors with controversy metrics
- `GET /api/health` - Health check

## Database Schema

- `colors` - Color definitions (RGB, hex)
- `sessions` - User session data
- `responses` - User color classifications

## License

MIT
