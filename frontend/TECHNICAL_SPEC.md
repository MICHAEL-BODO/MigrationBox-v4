# MigrationBox V5.0 — Frontend Technical Specification

**Version**: 5.0.0  
**Last Updated**: February 12, 2026  
**Architecture Reference**: ARCHITECTURE.md V5.0 Sections 13–14  
**Scope**: Desktop SaaS Control Panel + iPhone Companion App

---

## 1. Overview

MigrationBox V5.0 ships two frontend applications:

1. **Desktop SaaS Control Panel** — Full-featured Next.js 15 web application for migration management, I2I pipeline interaction, agent monitoring, cost optimization, and compliance reporting.
2. **iPhone Companion App** — React Native + Swift mobile app for voice-driven migration monitoring, approval gates, and executive reporting on the go.

Both frontends consume the same backend API layer (REST + GraphQL + WebSocket).

---

## 2. Desktop SaaS Control Panel

### 2.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | Server-side rendering, App Router |
| Language | TypeScript | 5.4+ | Type safety |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS |
| Components | shadcn/ui | Latest | Accessible, customizable primitives |
| State | Zustand | 4.x | Lightweight global state |
| Server State | TanStack Query | 5.x | API caching, mutations, optimistic updates |
| Forms | React Hook Form + Zod | Latest | Validation, type-safe forms |
| Charts | Recharts | 2.x | Cost, performance, timeline visualizations |
| Graphs | react-force-graph | 1.x | Dependency graph (Neo4j data) |
| Diagrams | D3.js | 7.x | Architecture diagrams, heatmaps |
| Code Viewer | Monaco Editor | Latest | Terraform preview, diff viewer |
| Real-time | WebSocket (native) | — | Agent events, migration progress |
| Auth | NextAuth.js + Cognito | Latest | OIDC, MFA, SSO |
| Testing | Vitest + Playwright | Latest | Unit + E2E |
| Bundler | Turbopack | Built-in | Fast dev builds |

### 2.2 Application Structure

```
frontend/desktop/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Auth group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/             # Authenticated group
│   │   ├── layout.tsx           # Sidebar + header layout
│   │   ├── page.tsx             # Dashboard home
│   │   ├── discovery/
│   │   │   ├── page.tsx         # Discovery overview
│   │   │   ├── new/page.tsx     # New discovery scan
│   │   │   └── [id]/page.tsx    # Discovery results detail
│   │   ├── assessment/
│   │   │   ├── page.tsx         # Assessment overview
│   │   │   └── [id]/page.tsx    # 6Rs results + Extended Thinking
│   │   ├── i2i/                 # I2I Pipeline (FLAGSHIP)
│   │   │   ├── page.tsx         # I2I natural language input
│   │   │   ├── history/page.tsx # Generation history
│   │   │   └── [id]/page.tsx    # IR preview + Terraform plan
│   │   ├── migrations/
│   │   │   ├── page.tsx         # Migration list
│   │   │   ├── new/page.tsx     # Migration wizard
│   │   │   └── [id]/page.tsx    # Migration detail + timeline
│   │   ├── agents/              # Agent Dashboard (FLAGSHIP)
│   │   │   ├── page.tsx         # Agent grid overview
│   │   │   └── [id]/page.tsx    # Individual agent detail
│   │   ├── knowledge/           # CRDT Knowledge Explorer (FLAGSHIP)
│   │   │   ├── page.tsx         # Pattern search
│   │   │   └── [id]/page.tsx    # Pattern detail
│   │   ├── optimization/
│   │   │   ├── page.tsx         # Cost optimization dashboard
│   │   │   └── copilot/page.tsx # AI Copilot natural language
│   │   ├── compliance/
│   │   │   ├── page.tsx         # Compliance overview
│   │   │   └── reports/page.tsx # Report generation
│   │   ├── settings/
│   │   │   ├── page.tsx         # Account settings
│   │   │   ├── team/page.tsx    # Team management
│   │   │   ├── billing/page.tsx # Stripe billing
│   │   │   └── api-keys/page.tsx
│   │   └── admin/               # Admin-only
│   │       ├── tenants/page.tsx
│   │       └── mcp/page.tsx     # MCP server health
│   ├── api/                     # Next.js API routes (BFF)
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── discovery/route.ts
│   │   ├── i2i/route.ts
│   │   └── ws/route.ts          # WebSocket upgrade
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Tailwind base
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Sidebar, Header, Breadcrumbs
│   ├── discovery/               # Discovery-specific components
│   ├── assessment/              # Assessment visualizations
│   ├── i2i/                     # I2I Pipeline components
│   │   ├── IntentInput.tsx      # Natural language textarea
│   │   ├── IRPreview.tsx        # Intent Schema YAML viewer
│   │   ├── PolicyViolations.tsx # OPA violation display
│   │   ├── TerraformPlan.tsx    # Monaco diff viewer
│   │   └── ApprovalGate.tsx     # Deploy approval button
│   ├── agents/                  # Agent monitoring
│   │   ├── AgentGrid.tsx        # 6-agent status grid
│   │   ├── AgentTimeline.tsx    # Event timeline
│   │   └── AgentDetail.tsx      # Individual agent view
│   ├── knowledge/               # CRDT explorer
│   ├── charts/                  # Reusable chart components
│   ├── graphs/                  # Dependency visualizations
│   └── shared/                  # Common (LoadingState, ErrorBoundary, etc.)
├── hooks/                       # Custom React hooks
│   ├── useDiscovery.ts
│   ├── useAssessment.ts
│   ├── useI2I.ts
│   ├── useAgents.ts
│   ├── useMigration.ts
│   ├── useWebSocket.ts
│   └── useAuth.ts
├── lib/                         # Utilities
│   ├── api.ts                   # API client (fetch wrapper)
│   ├── ws.ts                    # WebSocket client
│   ├── auth.ts                  # NextAuth config
│   └── utils.ts                 # Helpers
├── stores/                      # Zustand stores
│   ├── authStore.ts
│   ├── discoveryStore.ts
│   ├── migrationStore.ts
│   └── agentStore.ts
├── types/                       # TypeScript types
│   ├── api.ts
│   ├── discovery.ts
│   ├── assessment.ts
│   ├── i2i.ts
│   ├── agent.ts
│   └── migration.ts
├── public/                      # Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 2.3 Key Pages — Specifications

#### Dashboard Home (`/`)
- **Widgets**: Active migrations count, agent status summary, cost savings this month, discovery scan count, recent activity feed
- **Charts**: Migration success rate trend (30d), cost savings cumulative, agent utilization
- **Real-time**: WebSocket updates for active migration progress bars
- **Actions**: Quick links to New Discovery, New I2I Generation, New Migration

#### I2I Pipeline (`/i2i`) — FLAGSHIP PAGE
- **Input**: Large textarea for natural language infrastructure description with syntax highlighting hints
- **Multi-turn**: Chat-like refinement dialog when Claude needs clarification
- **IR Preview**: Side panel showing generated Intent Schema (YAML) with field-level confidence scores
- **Policy Check**: Real-time OPA/Rego validation results (pass/fail with fix suggestions)
- **Terraform Plan**: Monaco Editor showing generated Terraform with diff highlighting
- **Approval Gate**: "Review & Apply" button with approval workflow (owner → tech lead → executive for HIGH blast radius)
- **History**: Previous I2I generations with re-run capability

#### Agent Dashboard (`/agents`) — FLAGSHIP PAGE
- **Grid**: 6 agent cards showing status (idle/active/error), current task, uptime, success rate
- **Timeline**: EventBridge event stream showing agent-to-agent communication
- **Detail View**: Click agent → full task history, performance metrics, error logs
- **Coordination**: Visual flow showing which agents are collaborating on current migration

#### Knowledge Explorer (`/knowledge`) — FLAGSHIP PAGE
- **Search**: Full-text + vector search across CRDT knowledge patterns
- **Pattern Cards**: Migration pattern templates with success rate, usage count, last used
- **Insights**: AI-generated insights from cross-customer anonymized data
- **Graph View**: Neo4j knowledge graph visualization (patterns → strategies → outcomes)

#### Extended Thinking Viewer (embedded in Assessment + I2I)
- **Step-by-Step**: Collapsible reasoning chain showing each thinking step
- **Confidence Bars**: Per-dimension confidence intervals with SHAP attribution
- **Variables**: 100+ variable inspection panel grouped by category
- **Comparison**: Side-by-side comparison of alternative reasoning paths

### 2.4 Real-Time Architecture

```
Browser                    API Gateway              Backend
  │                           │                       │
  │  WebSocket Connect        │                       │
  │──────────────────────────>│──────────────────────>│
  │                           │                       │
  │  Subscribe: migration.123 │                       │
  │──────────────────────────>│──────────────────────>│
  │                           │                       │
  │                           │  EventBridge Event    │
  │                           │<──────────────────────│
  │  Push: progress update    │                       │
  │<──────────────────────────│                       │
  │                           │                       │
  │  Push: agent.task.started │                       │
  │<──────────────────────────│                       │
```

Channels:
- `migration:{id}` — Migration progress, phase transitions, errors
- `agent:{id}` — Agent status changes, task assignments, completions
- `discovery:{id}` — Discovery scan progress, resource counts
- `i2i:{id}` — I2I generation progress, layer transitions, results
- `alerts` — System alerts, approval requests

### 2.5 Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| sm | 640px | Mobile (limited, redirect to app) |
| md | 768px | Tablet |
| lg | 1024px | Small laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Wide desktop |

Minimum supported: 1024px (desktop SaaS is not designed for mobile browsers — use iPhone Companion App).

### 2.6 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.5s |
| Largest Contentful Paint | <2.5s |
| Cumulative Layout Shift | <0.1 |
| Time to Interactive | <3.5s |
| Interaction to Next Paint | <200ms |
| Bundle Size (initial) | <200KB gzipped |
| WebSocket Latency | <100ms |

### 2.7 Accessibility

- WCAG 2.1 AA compliance
- Full keyboard navigation (tab order, focus management)
- Screen reader support (ARIA labels, live regions for real-time updates)
- High contrast mode
- Reduced motion support
- Dark mode with system preference auto-detect

---

## 3. iPhone Companion App

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native 0.74+ | Cross-platform (iOS-first) |
| Native Modules | Swift (SwiftUI) | Whisper ASR, Polly TTS, haptics |
| Navigation | React Navigation 7 | Screen routing |
| State | Zustand | Lightweight global state |
| API Client | TanStack Query | Caching, offline support |
| Push | APNs (Firebase fallback) | Approval notifications |
| Voice ASR | Whisper Large v3 (on-device) | Hungarian speech-to-text |
| Voice TTS | Amazon Polly Neural (Dóra) | Hungarian text-to-speech |
| NLU | Bedrock Claude (API) | Voice command parsing |
| Offline | AsyncStorage + SQLite | Cached status, queued commands |
| Analytics | PostHog | Privacy-first analytics |

### 3.2 Application Structure

```
frontend/mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Dashboard summary
│   │   ├── MigrationsScreen.tsx    # Active + completed migrations
│   │   ├── MigrationDetailScreen.tsx # Timeline + agents + status
│   │   ├── ChatScreen.tsx          # Voice + text conversational UI
│   │   ├── ApprovalScreen.tsx      # Approval gate actions
│   │   ├── ReportsScreen.tsx       # PDF viewer for generated reports
│   │   └── SettingsScreen.tsx      # Account, notifications, voice
│   ├── components/
│   │   ├── VoiceButton.tsx         # Tap-to-speak / push-to-talk
│   │   ├── TranscriptBubble.tsx    # Real-time transcript display
│   │   ├── MigrationCard.tsx       # Status card with progress
│   │   ├── AgentStatusBadge.tsx    # Agent health indicator
│   │   ├── ApprovalCard.tsx        # Approve / Reject / Escalate
│   │   └── ChatMessage.tsx         # Text + voice message bubble
│   ├── native/                     # Swift native modules
│   │   ├── WhisperModule.swift     # On-device ASR (Whisper v3)
│   │   ├── PollyModule.swift       # TTS via Amazon Polly
│   │   └── HapticsModule.swift     # Haptic feedback patterns
│   ├── hooks/
│   │   ├── useVoice.ts             # Voice recording + ASR
│   │   ├── useTTS.ts               # Text-to-speech playback
│   │   ├── useMigrations.ts        # Migration API hook
│   │   └── useNotifications.ts     # Push notification handling
│   ├── services/
│   │   ├── api.ts                  # REST + GraphQL client
│   │   ├── ws.ts                   # WebSocket for real-time
│   │   ├── offline.ts              # Offline queue manager
│   │   └── auth.ts                 # Cognito auth
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── migrationStore.ts
│   │   └── voiceStore.ts
│   └── types/
│       └── index.ts
├── ios/                            # Xcode project
│   ├── MigrationBox/
│   │   ├── Info.plist
│   │   └── MigrationBox-Bridging-Header.h
│   └── Podfile
├── app.json
├── metro.config.js
├── tsconfig.json
└── package.json
```

### 3.3 Voice Pipeline

```
User speaks (Hungarian/English)
       │
       ▼
On-device Whisper Large v3 (Swift native module)
       │ Raw transcript
       ▼
Bedrock Claude NLU (API call)
       │ Parsed intent + entities
       ▼
Command Router
       │
       ├── Status query → Fetch migration status → Format response
       ├── Approval → Show approval card → Wait for tap
       ├── Navigation → Switch screen
       └── Complex query → Forward to backend → Stream response
       │
       ▼
Amazon Polly Neural (Dóra voice — Hungarian)
       │ Audio stream
       ▼
User hears response + sees transcript
```

Voice interaction targets:
- ASR latency: <2s (on-device Whisper)
- NLU latency: <1s (Bedrock API)
- TTS latency: <1.5s (Polly streaming)
- Total round-trip: <5s

### 3.4 Key Screens

#### Home Screen
- Active migrations count with mini progress bars
- Agent health summary (6 dots: green/yellow/red)
- Cost savings this month
- Recent activity feed (last 10 events)
- Quick action: Voice command button (center bottom)

#### Chat Screen (Primary Interaction)
- Messages list (text + voice bubbles)
- Voice input button (tap-to-speak, visual waveform)
- Text input fallback
- Inline migration status cards
- Inline approval gates
- "Show me the Terraform plan" → PDF viewer

#### Migration Detail Screen
- Timeline visualization (phases with timestamps)
- Agent activity for this migration
- Live log stream (filtered)
- Rollback button (confirmation required)
- Export: Email summary, AirDrop PDF

#### Approval Screen
- Approval queue (pending items)
- Each item: summary, risk level, requesting agent, blast radius
- Actions: Approve / Reject / Escalate / Request More Info
- Push notification deep-link to specific approval

### 3.5 Offline Mode

When network is unavailable:
- Cached migration statuses (last sync timestamp shown)
- Voice commands queued locally (SQLite)
- Commands replayed when network returns
- Push notifications still received (APNs)
- Read-only mode for reports and history

### 3.6 iOS-Specific Requirements

| Requirement | Specification |
|-------------|--------------|
| Minimum iOS | 17.0 |
| Target Devices | iPhone 14+ (A15 Bionic for Whisper) |
| App Size | <100MB (without Whisper model) |
| Whisper Model | ~400MB (downloaded on first launch) |
| Permissions | Microphone, Push Notifications, Network |
| App Store | Standard review (no private APIs) |
| Biometric | Face ID / Touch ID for approval gates |

---

## 4. Shared API Contract

Both frontends consume the same API:

### REST Endpoints (Primary)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/discovery/scan | Start discovery scan |
| GET | /api/v1/discovery/{id} | Get discovery results |
| POST | /api/v1/assessment/{id}/analyze | Run 6Rs assessment |
| GET | /api/v1/assessment/{id} | Get assessment results |
| POST | /api/v1/i2i/generate | I2I: natural language → IR → Terraform |
| GET | /api/v1/i2i/{id} | Get I2I generation status + result |
| POST | /api/v1/i2i/{id}/apply | Apply generated Terraform |
| POST | /api/v1/migration | Create migration |
| GET | /api/v1/migration/{id} | Get migration status |
| POST | /api/v1/migration/{id}/rollback | Trigger rollback |
| GET | /api/v1/agents | List agent statuses |
| GET | /api/v1/agents/{id} | Get agent detail |
| GET | /api/v1/knowledge/search | Search CRDT patterns |
| POST | /api/v1/optimization/analyze | Run cost optimization |
| POST | /api/v1/approval/{id}/approve | Approve action |
| POST | /api/v1/approval/{id}/reject | Reject action |

### GraphQL (Complex Queries)

```graphql
type Query {
  assessment(id: ID!): Assessment
  migrationTimeline(id: ID!): [TimelineEvent!]!
  knowledgePatterns(query: String!, limit: Int): [KnowledgePattern!]!
  agentCoordination(migrationId: ID!): AgentCoordinationGraph
  costProjection(workloadId: ID!, years: Int!): CostProjection
}
```

### WebSocket Events (Real-time)

```typescript
// Subscribe
{ type: 'subscribe', channel: 'migration:abc123' }

// Events received
{ type: 'migration.progress', data: { phase: 'data-transfer', percent: 45 } }
{ type: 'agent.task.started', data: { agentId: 'iac-gen', task: 'generate-terraform' } }
{ type: 'approval.requested', data: { id: 'apr-123', level: 'HIGH', requester: 'optimization-agent' } }
{ type: 'i2i.layer.complete', data: { layer: 2, status: 'pass', violations: 0 } }
```

---

## 5. Authentication & Authorization

### Desktop (NextAuth.js + Cognito)
- OIDC flow via Cognito User Pool
- MFA enforced for admin roles
- SSO support (SAML 2.0, Azure AD, Google Workspace)
- JWT tokens (RS256, 1hr access, 7d refresh)
- Role-based access: Admin, Manager, Developer, Viewer

### Mobile (Cognito SDK)
- Same Cognito User Pool
- Biometric unlock (Face ID / Touch ID) after initial auth
- Secure token storage (iOS Keychain)
- Background token refresh
- Push notification token registration on login

### RBAC Matrix

| Feature | Admin | Manager | Developer | Viewer |
|---------|-------|---------|-----------|--------|
| Discovery scans | ✅ | ✅ | ✅ | 👁️ |
| Assessment analysis | ✅ | ✅ | ✅ | 👁️ |
| I2I generation | ✅ | ✅ | ✅ | 👁️ |
| I2I apply (deploy) | ✅ | ✅ | ❌ | ❌ |
| Migration create | ✅ | ✅ | ❌ | ❌ |
| Migration rollback | ✅ | ✅ | ❌ | ❌ |
| Approval gates | ✅ | ✅ | ❌ | ❌ |
| Agent management | ✅ | ❌ | ❌ | ❌ |
| Billing / settings | ✅ | ❌ | ❌ | ❌ |
| Team management | ✅ | ✅ | ❌ | ❌ |

---

## 6. Testing Strategy

### Desktop
- **Unit**: Vitest for components + hooks (>80% coverage)
- **Integration**: Testing Library for page-level flows
- **E2E**: Playwright for critical user journeys (discovery → assessment → I2I → migration)
- **Visual Regression**: Chromatic / Percy for UI snapshots
- **Accessibility**: axe-core automated checks
- **Performance**: Lighthouse CI in pipeline

### Mobile
- **Unit**: Jest for components + hooks
- **Integration**: Detox for iOS E2E
- **Voice**: Manual testing for Whisper accuracy (Hungarian + English)
- **Offline**: Network condition simulation tests
- **Performance**: Xcode Instruments profiling

---

*Last Updated: February 12, 2026*  
*Architecture Reference: ARCHITECTURE.md V5.0 Sections 13–14*
