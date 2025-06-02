
# 🏓 ft_transcendence

A real-time multiplayer Pong game web application built as part of the 42 School curriculum.

## 📋 Project Overview

ft_transcendence is a full-stack web application featuring:
- Classic Pong gameplay with modern enhancements
- Real-time multiplayer capabilities
- Tournament system with bracket generation
- User authentication and profiles
- Live chat functionality
- AI opponents

**Total Points:** 115/100 (7 Major + 3 Minor modules)

## 👥 Team Structure & Responsibilities

| Role | Team Member | Modules |
|------|-------------|---------|
| **Frontend Developer** | Alec | Core Pong + Tailwind UI + Game Customization |
| **Backend Developer** | Moritz | Fastify Framework + SQLite Database + Live Chat  |
| **Realtime/AI Developer** | Olena | Remote Players + AI Opponent + Server-Side Pong |
| **Security/Auth Developer** | Elmira | User Management + Google OAuth (10pts) + 2FA & JWT |
| **DevOps Engineer** | Görkem | Docker Setup + HTTPS/WSS + Monitoring with Prometheus/Grafana |

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Side"
        UI[TypeScript SPA<br/>Tailwind CSS]
        Canvas[Pong Game Canvas]
        UI --> Canvas
    end

    subgraph "Gateway Layer"
        Nginx[Nginx Reverse Proxy<br/>HTTPS/WSS]
    end

    subgraph "Application Layer"
        Backend[Fastify Backend<br/>Node.js + TypeScript]
        WS[WebSocket Server<br/>Real-time Events]
        Auth[Auth Service<br/>JWT + 2FA]
        Chat[Live Chat Service]
    end

    subgraph "Data Layer"
        DB[(SQLite Database)]
        Cache[In-Memory State<br/>Game Sessions]
    end

    subgraph "External Services"
        Google[Google OAuth 2.0]
        Monitoring[Prometheus<br/>+ Grafana]
    end

    UI <-->|HTTPS| Nginx
    Canvas <-->|WSS| Nginx
    Nginx <--> Backend
    Nginx <--> WS
    Backend <--> Auth
    Backend <--> Chat
    Backend <--> DB
    WS <--> Cache
    Auth <--> Google
    Backend --> Monitoring
    WS --> Monitoring

    style UI fill:#3B82F6
    style Canvas fill:#10B981
    style Backend fill:#8B5CF6
    style Auth fill:#F59E0B
    style Monitoring fill:#6B7280
```

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/korberlin/ft_transcendence.git
cd ft_transcendence

# Start all services with Docker
docker-compose up -d

# Access the application
# https://localhost:443
```

## 📁 Project Structure

```
ft_transcendence/
├── frontend/          # TypeScript SPA + Game Engine
├── backend/           # Fastify API Server
├── realtime/          # WebSocket Server
├── auth/              # Authentication Service
├── docker/            # Docker Configurations
├── docs/              # Documentation
└── docker-compose.yml # Orchestration
```

## 🔄 Development Workflow

### Branch Naming
- `feature/[epic]-[description]` - New features
- `fix/[issue-number]-[description]` - Bug fixes
- `chore/[description]` - Maintenance tasks

### Commit Convention
```
[EPIC] Brief description

- Detailed change 1
- Detailed change 2

Issue: #XX
```

## 📅 Current Sprint: Week 1-2 (Foundation)

### Sprint Goals
Establish the foundational architecture and core functionality for the project.

### Sprint Tasks

**DevOps:**
- [ ] #7 Setup Docker development environment
- [ ] #13 Configure HTTPS and WSS

**Frontend:**
- [ ] #8 Initialize TypeScript SPA project
- [ ] #10 Implement basic Pong game mechanics
- [ ] #15 Create basic UI layout

**Backend:**
- [ ] #9 Initialize backend project structure
- [ ] #12 Setup database with SQLite
- [ ] #16 Implement Fastify framework

**Security:**
- [ ] #11 Design authentication architecture

**Realtime:**
- [ ] #14 Research WebSocket implementation

## 🛠️ Tech Stack

- **Frontend:** TypeScript, Tailwind CSS, Canvas API
- **Backend:** Node.js, Fastify, TypeScript
- **Database:** SQLite
- **Real-time:** WebSocket (ws)
- **Auth:** JWT, Google OAuth 2.0, TOTP
- **DevOps:** Docker, Nginx, Prometheus, Grafana
- **Security:** HTTPS/WSS, Rate Limiting, Input Validation

## 📊 Module Dependencies

```mermaid
graph LR
    Core[Core Pong] --> Remote[Remote Players]
    Core --> AI[AI Opponent]
    Core --> Custom[Customization]
    Auth[User Management] --> Chat[Live Chat]
    Auth --> OAuth[Google OAuth]
    Backend[Fastify] --> DB[SQLite]
    Backend --> SSP[Server-Side Pong]
    Docker[Docker Setup] --> All[All Modules]
```

## 🔐 Security Requirements

- ✅ All passwords hashed (bcrypt)
- ✅ HTTPS/WSS for all connections
- ✅ Protection against SQL injection & XSS
- ✅ JWT token authentication
- ✅ Rate limiting on API endpoints
- ✅ Input validation & sanitization

## 📝 Notes

- Single-page application with browser history support
- Compatible with latest Mozilla Firefox
- No unhandled errors or warnings
- Single command deployment via Docker

---

```
