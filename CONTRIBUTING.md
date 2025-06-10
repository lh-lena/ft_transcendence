# Contributing to ft_transcendence

## Getting Started

```bash
git clone https://github.com/korberlin/ft_transcendence.git
cd ft_transcendence
git checkout develop
make dev
```

## Git Workflow

### Branches
- `main` - Production code (protected, requires 2 reviews)
- `develop` - Integration branch (protected, requires 2 reviews)
- Feature branches - Created from develop for new work

### Branch Naming
```
feature/[service]-[description]  # New features
fix/[issue]-[description]        # Bug fixes
chore/[description]              # Maintenance
```

Examples: `feature/backend-tournament-api`, `fix/23-websocket-crash`

### Creating a Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

### Pull Request Process
1. Rebase on latest develop
2. Push feature branch
3. Create PR to develop
4. Get 2 approvals
5. Merge

Requirements:
- Descriptive title and description
- Link related issues
- All checks must pass
- No merge conflicts

## Development Standards

### Service Ports
- Frontend: 3000 (TypeScript SPA)
- Backend: 8080 (REST API)
- Realtime: 8081 (WebSocket)
- Auth: 8082 (Authentication)

### Code Requirements
- TypeScript for all services
- Handle all errors
- No hardcoded secrets
- Input validation on all endpoints
- Follow existing patterns

### Testing Changes
```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:8080/api/health

# WebSocket (browser console)
new WebSocket('ws://localhost:8081')
```

### Docker Commands
```bash
make dev                    # Start all services
make down                   # Stop all services
make logs                   # View logs
make shell SERVICE=backend  # Access container
```

## Security

Never commit:
- API keys or secrets
- .env files
- User credentials
- Database files

Always:
- Validate user input
- Use parameterized queries
- Hash passwords
- Check authentication