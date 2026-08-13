# 🏗️ PANCHAYAT AI SYSTEM DESIGN & ARCHITECTURE SPECIFICATION

## 1. Executive Summary
Panchayat AI is an autonomous, multi-agent local market negotiation and price-discovery platform designed to resolve the offline information asymmetry and bargaining power gap between customers and local merchants.

---

## 2. Core Architecture Principle: "AI is NEVER the Source of Truth"

```
┌───────────────┐       ┌──────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  LLM Agent    │ ────► │  Business Rules      │ ────► │  Fact Bus              │ ────► │  Database & Real-Time  │
│  Proposes     │       │  Deterministic       │       │  Shared Memory Ledger  │       │  WebSocket Broadcast   │
│  Action       │       │  Validation Engine   │       │  Update                │       │  To UI                 │
└───────────────┘       └──────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

### Validation Invariants:
1. **Customer Budget Floor:** Proposed price must be $\le$ Customer Target Budget.
2. **Merchant Margin Floor:** Proposed price cannot breach seller flexibility limit $P_{\text{min\_floor}}$.
3. **Round Bound:** Negotiation steps capped at $R \le 4$.
4. **Fact Bus Monotonicity:** Fact Bus updates are monotonically non-increasing (prices strictly decrease or match).

---

## 3. Monorepo Directory Structure

```
panchayat-ai/
├── apps/
│   ├── web/                    # Frontend Web App (React / Next.js, Tailwind, Framer Motion, Lucide)
│   └── api/                    # FastAPI Python Backend (Python, Pydantic, WebSockets, Agents, Rules Engine)
├── packages/
│   ├── shared-types/           # Shared TypeScript Data Definitions
│   ├── ui/                     # Design System Components
│   └── config/                 # Shared Configurations
├── infrastructure/
│   ├── docker/                 # Container Dockerfiles
│   └── deployment/             # Deployment Manifests
├── docs/
│   ├── architecture/           # Architecture Specifications & Blueprints
│   └── api/                    # API Documentation & Postman Schemas
├── .env.example
├── docker-compose.yml
└── package.json
```
