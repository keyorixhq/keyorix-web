# Keyorix Backend Architecture

## Overview

Keyorix Backend is the central system responsible for:
- secret lifecycle management
- secret detection
- encryption and secure storage
- authentication and authorization
- sharing and access control
- audit logging
- API layer for CLI, MCP, and SDKs

Backend is the **system of record** for all secrets and security metadata.

---

## Architecture Type

Current system is a:

> Modular monolith with emerging domain boundaries

It is not yet a distributed system, but contains clear separations of concerns.

---

## Core Responsibilities

### 1. Secret Detection (CLI-based engine)

Detection is implemented in the CLI layer using a regex-based scanner.

Responsibilities:
- scan filesystem, git working tree, or commits
- detect hardcoded credentials and secrets
- classify findings by risk level (high / medium / low)
- enrich findings with metadata (reason, source type)

Implementation:
- `internal/cli/secret/scan.go`

Detection is currently:
- rule-based (regex patterns)
- deterministic
- stateless
- non-AST-based

Supported secret types:
- AWS keys
- API keys and tokens
- database credentials
- JWT secrets
- private keys
- configuration leaks (.env, yaml, json)

Output:
- ScanReport
- ScanFinding

---

### 2. Secret Lifecycle Management (Core Service)

Central domain service responsible for managing secrets after detection or API ingestion.

Responsibilities:
- ingest secrets from scan or API
- normalize secret structure
- deduplicate entries
- manage lifecycle state
- orchestrate encryption before storage

Implementation:
- `internal/core/service.go`

---

### 3. Storage Layer

Abstract persistence layer for all system data.

Supported backends:
- SQLite (local / development)
- PostgreSQL (production)

Responsibilities:
- store encrypted secrets
- store encrypted DEK + KEK metadata
- store sharing relationships
- store audit logs
- store system catalog (namespace, zone, environment)

Implementation:
- `internal/storage/`

Important constraint:
- storage layer contains NO business logic

---

### 4. Encryption Layer

Implements DEK/KEK encryption model.

Flow:
- generate DEK (Data Encryption Key)
- encrypt secret using DEK
- encrypt DEK using KEK (Key Encryption Key)
- store encrypted secret + encrypted DEK

Responsibilities:
- encryption / decryption operations
- key management
- secure key handling for runtime decryption

Implementation:
- `internal/encryption/`

---

### 5. Authentication Layer

Responsible for identity validation and session handling.

Responsibilities:
- validate API tokens
- resolve sessions
- enforce token expiration
- retrieve user identity

Flow:
- token → session lookup → user resolution → role retrieval

---

### 6. Authorization Model (Hybrid RBAC + ACL)

Keyorix uses a hybrid authorization model:

#### RBAC (Role-Based Access Control)
- roles: admin, viewer, etc.
- role → permission mapping

Permissions include:
- secrets.read / write / delete
- users.read / write / delete
- roles.read / write / assign
- audit.read
- system.read

#### ACL (Access Control List)
- per-secret sharing permissions
- user-level or group-level access

#### Ownership Model
- secret owner has full control
- overrides ACL in most cases

---

### 7. Sharing System

Implements fine-grained secret sharing.

Features:
- user-to-user sharing
- group sharing (partially implemented)
- permission levels: read / write
- sharing metadata for UI layer

Core entities:
- ShareRecord
- SharingStatus
- SharingIndicators

---

### 8. Dashboard & Analytics

Provides aggregated user-facing insights.

Metrics:
- total secrets
- shared secrets
- secrets shared with user
- expiring secrets
- activity feed

Additional features:
- trend computation (snapshot-based)
- recent activity aggregation
- expiration tracking (30-day window)

---

### 9. Audit System

Tracks all system events for observability and security.

Event types:
- secret.created
- secret.updated
- secret.deleted
- secret.read

Used for:
- activity feeds
- compliance
- debugging
- security monitoring

---

### 10. Catalog System

Infrastructure metadata system:

Entities:
- Namespace
- Zone
- Environment

Used for:
- organization of secrets
- filtering and grouping
- multi-tenancy foundation (future)

---

## Core Backend Flows

---

### 1. Scan Flow

- CLI receives scan command
- filesystem traversal is executed
- regex-based detection engine runs
- findings are classified and enriched
- ScanReport is generated
- optionally forwarded to import pipeline

---

### 2. Import Flow

- scan findings are received
- validation and normalization applied
- secrets are encrypted using DEK
- DEK is encrypted using KEK
- encrypted data stored in storage layer

---

### 3. Retrieval Flow

- request is authenticated
- encrypted secret is fetched from storage
- DEK is decrypted
- secret is decrypted
- result is returned with controlled exposure

---

### 4. Sharing Flow

- share is created via API or CLI
- ACL record is stored
- access resolution happens at read time
- RBAC + ACL + ownership are combined for decision making

---

### 5. Dashboard Flow

- secrets are fetched
- shares are fetched
- audit logs are queried
- aggregates are computed
- trends are calculated from snapshots
- DashboardStats DTO is returned

---

## Domain Models

### Secret
- encrypted value
- encrypted DEK
- metadata (type, environment, namespace, zone)
- owner
- expiration

---

### Share
- secret ID
- recipient (user or group)
- permission (read / write)
- timestamps

---

### User
- identity
- roles
- session tokens

---

### AuditEvent
- event type
- actor
- timestamp
- resource reference

---

### Catalog Entities
- namespace
- zone
- environment

---

## Key Invariants

- no plaintext secrets are stored in persistence layer
- encryption is mandatory before storage
- storage layer contains no business logic
- scan engine does not directly persist data
- backend is single source of truth
- all access is mediated by authentication and authorization layers

---

## Current Architectural Characteristics

### Strengths
- strong encryption model (DEK/KEK)
- working RBAC system
- functional ACL sharing layer
- audit logging system exists
- CLI-driven scanning pipeline
- storage abstraction cleanly separated

### Weaknesses
- detection engine is CLI-embedded
- domain logic mixed with presentation models in core
- authorization logic not centralized into a policy engine
- no plugin-based detection framework yet

---

## Summary

Keyorix Backend is a secure secret management system combining:
- static secret detection
- encrypted storage
- hybrid RBAC + ACL authorization
- audit and analytics capabilities

It is currently a modular monolith with clear evolution paths toward a domain-separated security platform.