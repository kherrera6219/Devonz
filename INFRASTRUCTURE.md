# Local Infrastructure Guide

This project uses Docker to provide a robust backend suite including PostgreSQL (with pgvector), MinIO object storage, Redis caching, and Neo4j graph database. This infrastructure powers the agent's advanced capabilities like RAG memory, knowledge graph mapping, and optimized project imports.

## 🚀 Quick Start

Ensure Docker is running, then start the services from the project root:

```bash
cd database
docker compose up -d
```

---

## 🐘 PostgreSQL & pgvector

A local PostgreSQL instance enhanced with `pgvector` for semantic search and Retrieval-Augmented Generation (RAG).

- **Endpoint**: `localhost:5432`
- **Feature**: `pgvector` enabled for long-term agent memory.
- **Connection String**: `postgresql://devonz_user:devonz_password@localhost:5432/devonz_db`

### PostgreSQL Role
- **RAG Indexing**: Stores document embeddings generated during folder imports.
- **Agent Memory**: Allows the agent to query relevant code snippets across the entire project history.

---

## 📦 MinIO Object Storage (S3 Compatible)

S3-compatible storage for local file management, assets, and project backups.

- **API Endpoint**: `http://localhost:9000`
- **Console**: [http://localhost:9001](http://localhost:9001)
- **Bucket**: `devonz-assets`

### Role in Devonz

- **Optimized Import**: When a local folder is imported, it is first mirrored to MinIO. This ensures a persistent, cloud-syncable backup before processing.
- **Media Assets**: Stores AI-generated images and audio files created by agent tools.

---

## 🏎️ Redis Cache & Data Store

In-memory data store for performance optimization and real-time synchronization.

- **Endpoint**: `localhost:6379`
- **Console**: [http://localhost:8001](http://localhost:8001)

### Redis Role

- **Caching**: Accelerates file system operations and API responses.
- **State Management**: Handles session data and real-time terminal synchronization.
- **Agent Orchestration**: Manages task queuing and state persistence for the multi-agent system.

---

## 🕸️ Neo4j Graph Database

The graph database stores the relationships between files, dependencies, and code symbols, enabling advanced code navigation and impact analysis.

- **Endpoint**: `localhost:7474` (Browser UI), `localhost:7687` (Bolt)
- **Feature**: Knowledge Graph for dependency tracking.
- **Plugins**: `apoc` enabled for utility functions.
- **Credentials**: `neo4j` / `devonz_graph_password`

### Neo4j Role

- **Dependency Graph**: Maps file imports and exports to visualize project structure.
- **Impact Analysis**: Helps the Architect agent understand what files might be affected by a change.
- **Recursive Research**: Enables the Researcher agent to traverse complex dependencies for deep understanding.

---

## 🛠️ Management

All infrastructure logic is contained in the [database/](file:///c:/software/Devonz/database/) directory.

- **Status**: `docker compose ps`
- **Logs**: `docker compose logs -f`
- **Wipe Data**: `docker compose down -v` (⚠️ Deletes all DB and storage data)

## 📄 Environment Configuration

Connection details are automatically synchronized in your [.env.local](file:///c:/software/Devonz/.env.local) file.
