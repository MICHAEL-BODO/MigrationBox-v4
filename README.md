# MIKE-FIRST v6.0

> **Migration, Intelligence, Compliance, Engineering — Fully Integrated Resilience & Security Toolkit**

[![Version](https://img.shields.io/badge/version-6.0.0--alpha-blue)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)]()
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)]()

---

## What is MIKE-FIRST?

MIKE-FIRST is an enterprise multi-cloud platform that unifies compliance auditing, infrastructure intelligence, and cloud migration into a single tool. It combines the power of three proven engines:

| Engine          | What it does                                          | Key metric             |
| --------------- | ----------------------------------------------------- | ---------------------- |
| **🛡️ AUDITOR**  | 1-click compliance audit (ISO27001, SOX, GDPR, HIPAA) | 30 min, zero errors    |
| **📊 ANALYZER** | Cost optimization + security hardening                | 30% savings guaranteed |
| **🚀 MIGRATOR** | Zero-downtime cloud migration                         | 10 weeks → 3 hours     |

### Key Differentiators

- **120 functions** across 3 engines covering the full cloud lifecycle
- **Multi-cloud**: AWS, Azure, GCP, and on-premises — unified
- **Guardian Agent**: Always-on compliance enforcement that _prevents_ violations
- **Real-time security repositioning**: Auto-adjusts defenses during active attacks
- **AI-powered**: Gemini 3 Pro + Claude 4 Opus via MCP for intelligent automation
- **Dual-mode**: Production (live APIs) and Demo (LocalStack simulation)

---

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 9+
- Docker Desktop (for LocalStack)
- Python 3.12+ (for NEAT microservices)

### Install & Run

```bash
# Clone and install
git clone https://github.com/MICHAEL-BODO/MigrationBox-v4.git
cd MigrationBox-v4
pnpm install

# Start demo mode (LocalStack + all services)
docker compose up -d
pnpm dev

# Open dashboard
open http://localhost:3000
```

### Environment Setup

```bash
cp .env.example .env
# Set MIKE_FIRST_MODE=demo for LocalStack simulation
# Set MIKE_FIRST_MODE=live for real cloud credentials
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│            MIKE-FIRST v6.0              │
│                                         │
│  🛡️ AUDITOR   📊 ANALYZER   🚀 MIGRATOR │
│  42 functions  39 functions  39 functions│
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   @mike-first/core               │  │
│  │   Cloud Abstraction Layer        │  │
│  └───────────────────────────────────┘  │
│       ↓           ↓          ↓          │
│      AWS        Azure       GCP         │
│               On-Prem                   │
└─────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details with Mermaid diagrams.

---

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Primary    | TypeScript / Node.js (pnpm monorepo)  |
| Secondary  | Python 3.12 (NEAT microservices)      |
| Frontend   | Next.js 15, React 19, Tailwind CSS    |
| IaC        | Terraform + Cloud Foundation Fabric   |
| Testing    | LocalStack, Playwright, Vitest        |
| Deployment | Serverless Framework, Cloud Run, K8s  |
| AI         | Gemini 3 Pro, Claude 4 Opus (via MCP) |

---

## Documentation

| Document                             | Description                              |
| ------------------------------------ | ---------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full system architecture + diagrams      |
| [TODO.md](./TODO.md)                 | Prioritized task list with critical path |
| [STATUS.md](./STATUS.md)             | Current project status dashboard         |
| [TASK.md](./TASK.md)                 | Sprint tracking                          |
| [CHANGELOG.md](./CHANGELOG.md)       | Version history                          |

---

## License

Proprietary — © 2026 Michael Logicalmoon, Budapest, Hungary
