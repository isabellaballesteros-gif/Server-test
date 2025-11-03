# Basic Node.js Server

A simple HTTP server built using only Node.js built-in modules (no external dependencies).

## Features

- Pure Node.js (no external dependencies)
- HTTP server with routing
- JSON body parsing
- Basic API routes
- Error handling
- Health check endpoint
- 404 handling
- CORS support

## Setup

1. **No installation required!** This server uses only Node.js built-in modules.

2. Start the server:
   ```bash
   node server.js
   ```

3. The server will run on `http://localhost:3000`

## Available Routes

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## Example Usage

### Get all users:
```bash
curl http://localhost:3000/api/users
```

### Create a new user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'
```

### Health check:
```bash
curl http://localhost:3000/health
```

## Environment Variables

- `PORT` - Server port (default: 3000)

## Built-in Modules Used

- `http` - HTTP server functionality
- `url` - URL parsing
- `fs` - File system operations (if needed)
- `path` - Path utilities (if needed)
