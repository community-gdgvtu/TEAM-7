# 🏛️ Panchayat AI — Autonomous Local Market Negotiation & Price-Discovery Platform

> **Panchayat AI** is an AI-powered local market negotiation and price-discovery assistant that bridges the time, information, and bargaining-power gap between local offline merchants and customers.

---

## 📜 Real Data Policy

**Panchayat AI does not fabricate seller identities, prices, locations, availability or negotiation outcomes. Business discovery is based on external location/business data sources. Seller offers are generated only by connected sellers through authorized communication channels. AI-generated content is treated as a proposal and validated against system state before becoming an operational fact.**

---

## 🗺️ Real Google Maps Integration Architecture

Panchayat AI integrates directly with **Google Maps Platform** APIs:

1. **Google Places API**:
   - **Nearby Sellers & Business Details**: Live place search, place IDs, categories, phone numbers, ratings, business status.
   - **Geocoding & Reverse Geocoding**: Converts coordinates to human-readable localities and vice versa.

2. **Google Routes API**:
   - **Distance & Travel Time Computation**: Traffic-aware driving routes, ETAs, and distance matrices between customers and local merchants.

---

## 🌟 Hero Feature: Fact Bus (Shared Negotiation Memory)

The **Fact Bus** is Panchayat AI’s real-time, shared negotiation memory. As worker agents negotiate concurrently with multiple local sellers, every price drop is recorded in the Fact Bus. When a lower offer is discovered (e.g. Seller B offers ₹59,500), Panchayat AI immediately leverages this benchmark in active negotiations with competing sellers (*"Another verified local seller offered ₹59,500. Can you improve that?"*).

---

## 🛡️ Core Architecture Principle

> **"Your AI should never be the source of truth."**

```
LLM Proposes Action  ──►  Business Rules Validation  ──►  Fact Bus & DB Commit
```

1. **LLM / Agent Proposes**: Proposes a price counter or strategy (e.g. "Offer ₹58,500").
2. **Business Rules Validation**: Checks customer budget (₹60,000), seller profit floor (₹58,000), and max rounds (4).
3. **Fact Bus Update**: If **VALID**, the offer is committed to Fact Bus memory and broadcasted.

---

## 📁 Monorepo Structure

```
panchayat-ai/
├── apps/
│   ├── web/               # Frontend (React, TypeScript, Tailwind CSS, Lucide)
│   └── api/               # FastAPI Backend (Python, Pydantic v2, WebSockets, Rules Engine, Places/Routes API)
├── packages/
│   ├── shared-types/      # Shared TypeScript contracts
│   ├── ui/                # UI design system components
│   └── config/            # Shared configs
├── infrastructure/
│   ├── docker/            # Docker containers & Compose configurations
│   └── deployment/        # Kubernetes / Cloud deployment files
├── docs/
│   └── architecture/      # Technical Architecture Specs & Diagrams
├── .env.example
├── docker-compose.yml
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Web Application (Frontend)
```bash
npm run dev:web
# Launches on http://localhost:5173
```

### 2. FastAPI Backend Service (Python API & WebSockets)
```bash
cd apps/api
pip install -r requirements.txt
python app/main.py
# Runs FastAPI on http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

### 3. Docker Compose Orchestration
```bash
docker-compose up --build
```