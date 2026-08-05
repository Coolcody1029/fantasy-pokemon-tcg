# Fantasy TCG

Fantasy TCG is a fantasy sports platform built around the competitive Pokémon Trading Card Game.

Instead of drafting NFL or NBA players, users draft competitive Pokémon TCG players and compete against other fantasy teams based on their players' performances at real-world Regional Championships.

## About the Project

Fantasy TCG brings the structure of traditional fantasy sports to competitive Pokémon TCG.

Users can create or join leagues, draft competitive players, manage their roster, submit Regional lineups, and compete in head-to-head matchups throughout the season.

Player performance at real Pokémon TCG Regional Championships is converted into fantasy points, allowing fantasy teams to compete based on actual tournament results.

## Features

- User registration and authentication
- JWT-based authentication
- Fantasy league creation
- Invite-code league joining
- League commissioners
- Multiplayer fantasy drafts
- Competitive player draft pool
- Persistent team rosters
- Six-player Regional lineups
- Regional Championship schedule
- Head-to-head fantasy matchups
- Fantasy standings
- Player fantasy point tracking
- Regional result tracking
- Commissioner draft controls
- Protected admin tools
- Admin Regional management
- Automated competitive player data tools
- Limitless tournament data integration

## How Fantasy TCG Works

### 1. Create or Join a League

Users can create their own fantasy league or join an existing league using an invite code.

The league creator becomes the commissioner.

### 2. Draft Players

League members participate in a fantasy draft and select real competitive Pokémon TCG players.

Each drafted player becomes part of that fantasy team's permanent roster.

### 3. Set a Regional Lineup

Before each Regional Championship, fantasy managers select six players from their roster to start for that event.

Once the Regional begins, the lineup locks.

### 4. Earn Fantasy Points

Players earn fantasy points based on their real tournament performance.

### 5. Compete Head-to-Head

Fantasy teams are matched against one another during Regional weeks.

The team whose starting lineup earns the most fantasy points wins the matchup.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- ASP.NET Core
- C#
- Entity Framework Core
- REST API
- JWT Authentication

### Database

- PostgreSQL

### External Data

Competitive player and tournament information is integrated using data from Limitless TCG.

## Project Structure

```text
fantasy-pokemon-tcg/
│
├── backend/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Services/
│   ├── Program.cs
│   └── appsettings.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Local Development

### Requirements

Make sure the following are installed:

- .NET SDK
- Node.js
- PostgreSQL

### Backend

Navigate to the backend:

```bash
cd backend
```

Configure your local development settings in:

```text
appsettings.Development.json
```

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_POSTGRES_CONNECTION_STRING"
  },

  "Frontend": {
    "Url": "http://localhost:3000"
  },

  "Jwt": {
    "Key": "YOUR_DEVELOPMENT_JWT_SECRET"
  },

  "Admin": {
    "Email": "YOUR_ADMIN_EMAIL"
  }
}
```

Then start the API:

```bash
dotnet run
```

The development API runs on:

```text
http://localhost:5255
```

### Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env.local
```

and configure:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5255
```

Start the development server:

```bash
npm run dev
```

Then open the application at:

```text
http://localhost:3000
```

## Production Configuration

Fantasy TCG is designed to use environment variables for production configuration.

Backend environment variables include:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
Admin__Email
Frontend__Url
```

Frontend:

```text
NEXT_PUBLIC_API_BASE_URL
```

Sensitive production credentials should never be committed to the repository.

## Security

The application includes authorization protections for user and administrative functionality.

Examples include:

- JWT authentication
- User-owned fantasy team validation
- Commissioner-only draft controls
- Admin-only API endpoints
- Admin-only frontend routes
- Protected lineup submission
- Regional lineup locking

Authorization is enforced by the backend rather than relying solely on frontend route protection.

## Status

Fantasy TCG is currently under active development.

Core league, authentication, drafting, roster, Regional, matchup, standings, lineup, and administrative systems are implemented.

Production deployment is currently being prepared.

## Future Development

Planned improvements include continued work on:

- Production deployment
- Automated tournament result processing
- Fantasy scoring automation
- League scheduling
- Expanded player statistics
- Matchup history
- User profiles
- UI and mobile improvements
- Additional commissioner tools

## Disclaimer

Fantasy TCG is an independent fan project and is not affiliated with, endorsed by, or sponsored by The Pokémon Company, Nintendo, Game Freak, Creatures Inc., or Limitless TCG.

Pokémon and related trademarks are the property of their respective owners.

## Author

Developed by Cody C.

Software Engineering project combining full-stack web development with competitive Pokémon TCG and fantasy sports.
