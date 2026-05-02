# Architecture

Keyorix is a multi-component system for secret discovery, storage, and AI-driven interaction.

---

## Components

### Backend
Central system responsible for:
- REST API
- secret processing and validation
- encryption/decryption (see encryption.md)
- storage abstraction
- authentication and token management

---

### Frontend (Vite + React)
- UI for managing secrets
- communicates with backend via REST API
- contains no business logic

---

### MCP Server (keyorix-mcp)
AI interaction layer:
- converts natural language → structured commands
- calls backend APIs
- formats responses

Constraints:
- no business logic
- no encryption
- no auth logic

---

### SDKs
Supported languages:
- Node
- Python
- Go
- Java

Responsibilities:
- provide integration layer for external systems
- call backend APIs
- do not implement business logic or encryption

---

## Data Flow

User / CLI / AI  
→ MCP or frontend  
→ backend API  
→ secret processing  
→ encryption (DEK/KEK)  
→ storage  

---

## Storage

Pluggable storage layer.

Supported backends:
- SQLite (default, local-first)
- PostgreSQL (production)

Rules:
- storage must be interchangeable
- business logic must not depend on specific DB
- no DB-specific logic outside storage layer

---

## Authentication

Keyorix uses token-based authentication.

### Mechanism

- API keys / tokens are primary authentication method
- used by:
  - CLI (`auth login --api-key`)
  - SDKs
  - integrations

---

### Token Handling

- tokens are encrypted at rest (see encryption.md)
- encryption handled in backend
- token lifecycle (creation, validation, refresh) managed centrally

---

### Responsibilities

Backend:
- validates tokens
- manages token lifecycle
- handles encryption/decryption

MCP / Frontend:
- rely on backend authentication
- do not implement auth logic

---

### Invariants

- no plaintext token storage
- no auth logic outside backend
- tokens must always be encrypted at rest

---

## Key Decisions

- REST API (not GraphQL)
- backend is single source of truth
- MCP is a thin layer (no business logic)
- encryption centralized in backend (envelope encryption: DEK/KEK)
- storage is pluggable (SQLite / PostgreSQL)
- token-based authentication

---

## Invariants (DO NOT BREAK)

- no business logic in frontend
- no encryption outside backend
- no duplication of logic between MCP and backend
- API contracts must remain stable
- storage abstraction must be preserved
- all secrets and tokens must be encrypted at rest

---

## System Boundaries

Backend:
- owns all core logic
- owns encryption and auth

MCP:
- translation layer only

Frontend:
- presentation layer only

SDKs:
- integration layer only