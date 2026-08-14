# 🏛️ Panchayat AI — Autonomous Local Market Negotiation & Price-Discovery Platform

[![Build Status](https://img.shields.io/badge/Web%20Build-Passing%20(759ms)-emerald?style=flat-square&logo=vite)](https://github.com/community-gdgvtu/TEAM-7)
[![Backend Tests](https://img.shields.io/badge/Pytest-162%2F162%20Passed%20(100%25)-brightgreen?style=flat-square&logo=pytest)](https://github.com/community-gdgvtu/TEAM-7)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.109.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-v18.3.1-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Google Maps](https://img.shields.io/badge/Google%20Maps%20Platform-Places%20%26%20Routes%20API-4285F4?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)

> **Team 7 Hackathon Submission**: An autonomous, multi-agent local market negotiation platform designed for Tier-2 and Tier-3 Indian commerce. Bridges the information, distance, and bargaining-power gap between offline local merchants and customers.

---

## 📜 Real Data Policy

> **Panchayat AI does not fabricate seller identities, prices, locations, availability or negotiation outcomes. Business discovery is based on external location/business data sources. Seller offers are generated only by connected sellers through authorized communication channels. AI-generated content is treated as a proposal and validated against system state before becoming an operational fact.**

---

## 📖 The Story & Problem Statement

In local offline markets across Tier-2 and Tier-3 India (e.g., Gadag, Hulkoti, Hubballi, Mysuru), purchasing high-value products like laptops, smartphones, or electronics is a tedious, fragmented experience:

1. **Information Asymmetry & Time Waste**: Customers spend hours visiting physical stores one by one to discover who has stock, compare prices, and negotiate.
2. **Local Merchant Disadvantage**: Independent offline store owners lose customers to monolithic e-commerce platforms because they lack a digital real-time channel to present competitive counter-offers.
3. **Absence of Shared Price Discovery**: Customers negotiate blind, without knowing true local market benchmarks or floor prices.

### 💡 The Solution: Panchayat AI

**Panchayat AI** acts as an autonomous AI bargaining agent operating on behalf of the customer while empowering local merchants with a dedicated **Real Seller Web Portal**:

- **Real Location & Places Discovery**: Uses HTML5 Geolocation and Google Maps Platform Places & Routes APIs to find real verified local businesses near the user.
- **Shared Negotiation Memory (The Fact Bus)**: As multi-agent negotiations take place concurrently, every price drop is logged into a shared memory bus. Lower price benchmarks (e.g. Seller B offers ₹59,500) are automatically leveraged in negotiations with competing merchants.
- **Real Seller Web Portal**: Offline merchants log into their portal, manage product stock and floor prices, receive real-time customer requests, and dispatch binding counter-offers.
- **Multi-Factor Deal Intelligence**: Ranks all final verified deals using price savings, seller rating, physical distance, warranty terms, and merchant reliability.

---

## 🏗️ Core Architecture & 3 Pillars

```
                                 ┌─────────────────────────────────────────┐
                                 │            PANCHAYAT AI                 │
                                 └────────────────────┬────────────────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         ▼                                            ▼                                            ▼
┌─────────────────────────┐              ┌─────────────────────────┐              ┌─────────────────────────┐
│     CUSTOMER PILLAR     │              │    SELLER WEB PORTAL    │              │   PANCHAYAT AI ENGINE   │
├─────────────────────────┤              ├─────────────────────────┤              ├─────────────────────────┤
│ • Multi-Lingual Prompt  │              │ • Merchant Accounts     │              │ • Requirement Parsing   │
│ • Real HTML5 Geolocation│              │ • Persistent Inventory  │              │ • Fact Bus Memory Bus   │
│ • Google Places API     │              │ • Minimum Floor Prices  │              │ • Rules Engine (Safety) │
│ • Authorized Invites    │              │ • Live Counter-Offers   │              │ • Multi-Factor Ranking  │
└─────────────────────────┘              └─────────────────────────┘              └─────────────────────────┘
```

---

## 🔄 12-Step Real-Time Negotiation Trajectory

```
USER ("Laptop under ₹60,000")
  │
  ▼
1. REQUIREMENT AGENT (Multi-lingual parsing: Computers, ₹60k budget, 98% confidence)
  │
  ▼
2. REAL DEVICE LOCATION (HTML5 Geolocation: Hulkoti Market, Gadag)
  │
  ▼
3. GOOGLE PLACES (Places API: Discover nearby computer merchants)
  │
  ▼
4. REAL LOCAL BUSINESSES (Sri Lakshmi Electronics, Gadag Digital Store)
  │
  ▼
5. SELLER CONNECTION (Authorization check & Connection status)
  │
 ├─────────────────────────┐
 ▼                         ▼
6. Seller A (Real Portal)   Seller B (Real Portal)
   Quote: ₹62,000           Quote: ₹61,000
   │                        │
   └────────────┬───────────┘
                ▼
7.           FACT BUS (Shared Negotiation Memory Protocol)
                │
                ▼
8.       NEGOTIATION AGENT (Leverages Fact Bus Benchmark ₹61,000)
                │
                ▼
9.       Seller B Counter-Offer (₹59,500 - Below Target Budget!)
                │
                ▼
10.      OFFER VERIFICATION (Business Rules Engine Validation)
                │
                ▼
11.      DEAL INTELLIGENCE AGENT (Multi-Factor Score Calculation)
                │
                ▼
12.          CUSTOMER (Ranked Recommendation & Deal Acceptance)
```

---

## 🛡️ Security, RBAC & Role Invariants

Panchayat AI enforces strict **Role-Based Access Control (RBAC)** to ensure data privacy and role segregation:

| Role | Allowed Tabs / Views | Default Landing Tab | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **`CUSTOMER`** (Buyer) | `Customer Dashboard`, `Live Negotiation`, `Deal Intelligence` | `customer` | Submit product requirements, trigger bargains, accept deals. **Cannot** access Seller Portal or Admin views. |
| **`SELLER`** (Merchant) | `Seller Portal`, `Live Negotiation`, `Deal Intelligence` | `seller` | Manage store inventory, set min floor prices, submit live counter-offers. **Cannot** view buyer dashboard. |
| **`ADMIN`** (Market Admin)| `Customer`, `Negotiation`, `Results`, `Seller Portal`, `Command Center`, `Admin` | `admin` | Full system audit, seller verification, negotiation stream monitoring, system metrics. |

---

## ⚠️ Real-Time Honest Failure Handling Invariants

Panchayat AI strictly refuses to fabricate fake data when external services fail:

| Scenario | System State Invariant | User Message Rendered |
| :--- | :--- | :--- |
| **Google Places Failure** | `status = PLACES_API_FAILURE` | `"We couldn't retrieve nearby businesses right now. Please retry."` |
| **Seller No Response** | `status = NO_RESPONSE` | `"Seller has not responded yet."` |
| **AI Assistant Failure** | `status = AI_UNAVAILABLE` | `"AI negotiation assistant temporarily unavailable."` |
| **Maps Distance Failure** | `distanceKm = null` | `"Distance unavailable."` |

---

## 🗺️ Google Maps Platform Integration Details

1. **Google Places API (New)**: `fetch_nearby_real_sellers` executes live search (`places:searchText`) to discover place IDs, categories, phone numbers, store ratings, and operational business statuses.
2. **Google Geocoding API**: Bidirectional conversion between GPS coordinates and human-readable localities (`Hulkoti Market, Gadag`).
3. **Google Routes API**: `compute_route_eta` executes traffic-aware driving route matrices (`directions/v2:computeRoutes`) for precise travel time, distance, and ETAs.

---

## 📁 Monorepo Workspace Structure

```
panchayat-ai/
├── apps/
│   ├── web/                           # React + TypeScript Frontend
│   │   ├── src/
│   │   │   ├── components/            # UI Components (CustomerDashboard, SellerPortal, LiveNegotiation, Navbar)
│   │   │   ├── hooks/                 # Custom Hooks (useLocation, usePermission)
│   │   │   ├── services/              # Client Services (discoveryAgent, factBusStore, requirementAgent)
│   │   │   ├── stores/                # Global Stores (authStore, locationStore)
│   │   │   └── types/                 # Shared TypeScript Type Definitions
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                           # FastAPI Python Backend
│       ├── app/
│       │   ├── api/                   # API Route Handlers (routes.py)
│       │   ├── core/                  # Core Engines (rules_engine.py, fact_bus_real.py, google_places_service.py)
│       │   └── main.py                # FastAPI Application Entrypoint
│       ├── tests/                     # 162 Unit & Integration Pytest Suite
│       └── requirements.txt
│
├── .env.example
├── README.md
└── package.json
```

---

## 🚀 Local Development & Execution Setup

### 1. Web Frontend (React + Vite)
```bash
# Navigate to web app directory and start dev server
npm --prefix apps/web run dev
# Running on http://localhost:5173
```

### 2. FastAPI Backend (Python)
```bash
# Set PYTHONPATH and run FastAPI backend
cd apps/api
python -m pip install -r requirements.txt
python app/main.py
# Running on http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

### 3. Automated Test Verification (162 Pytest Tests)
```bash
$env:PYTHONPATH="apps/api"; python -m pytest apps/api/tests/ -v
# 162 passed in ~30s
```

### 4. Production Web Build Verification
```bash
npm --prefix apps/web run build
# Built in ~750ms with 0 TypeScript compilation errors
```

---

## 🏆 Hackathon Team Credits

Developed by **Team 7** for the GDG VTU Hackathon 2026.