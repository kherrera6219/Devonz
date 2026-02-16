# Deployment Guide

> **Version**: 1.0.0
> **Last Updated**: Feb 16, 2026 (Vite 7 & Infrastructure Upgrade)

## Prerequisites
-   **Node.js**: v20.19.0+ or v22.12.0+ (Required for Vite 7)
-   **PostgreSQL**: v15+ (with `pgvector` extension)
-   **MinIO**: Compatible S3 storage
-   **Neo4j** (Optional): For Graph RAG
-   **Windows SDK**: Required for MSIX packaging (`makeappx.exe`, `signtool.exe`)

## Environment Variables
Configure these in your production environment (e.g., Vercel, Docker, VPS).

### Security & Persistence
| Variable | Description |
| :--- | :--- |
| `APP_SECRET` | 32-character secret key for signing cookies and tokens |
| `ENCRYPTION_KEY` | 32-byte hex-encoded key for AES-256-GCM encryption |
| `REDIS_URL` | Redis connection string (e.g., `redis://localhost:6379`) |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |

## Build & Run

### 1. Build
Compiles the application for production.
```bash
pnpm run build
```

### 2. Start (Production)
Ensures all services are ready before starting.
```bash
pnpm run start
```
*Note: The system runs a **Deterministic Startup Validation** and **Port Conflict Resolution** on launch.*

### 4. Windows Desktop (MSIX)
For local desktop deployment, use the provided packaging script. This creates an isolated staging environment and sanitizes filenames for compatibility.

**Build:**
```powershell
./build-msix.ps1 -SkipBuild
```
*Note: Use `-SkipBuild` if you have already run `pnpm run build`.*

**Install (Requires Administrator):**
Elevated PowerShell is required to register the development certificate.
```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```
This generates and installs a signed MSIX package for secure distribution.

### 5. Docker (Alternative)
```bash
docker build -t devonz .
docker run -p 3000:3000 --env-file .env.production devonz
```

## Security Checklist
-   [x] Ensure `APP_SECRET` and `ENCRYPTION_KEY` are strong and unique.
-   [x] Verify HSTS and CSP headers are active.
-   [x] Confirm `SSRFGuard` internal IP range configuration.
-   [x] Verify Redis connection for state and usage monitoring.
