# Scalability & Performance Guide

> **Version**: 1.0.0
> **Last Updated**: Feb 2026

## Overview
This document describes the strategy for scaling Devonz from a single-node deployment to a distributed, high-availability cluster.

## 1. Database Scaling (PostgreSQL)
### Current State
-   Single Master with `pgvector` extension.
-   Connection Pooling via Supabase/PgBouncer.

### Future Strategy
-   **Read Replicas**: Offload generic `SELECT` queries to read-only replicas.
-   **Sharding**: Shard `project_files` and `chat_history` by `user_id` once we exceed 10TB data.
-   **Vector Search**: Move embeddings to a dedicated vector database (Weaviate/Milvus) if `pgvector` latency increases >500ms.

## 2. Caching Strategy
### Application Layer
-   **Redis Cluster**: Use for shared session storage and rate limiting.
-   **CDN**: Cache static assets (JS, CSS, Images) at the edge (Cloudflare/Vercel).

### AI Response Caching
-   **Semantic Caching**: Store LLM responses vector-indexed to serve identical queries instantly without calling the API.

## 3. Horizontal Scaling (Compute)
-   **Stateless Server**: The Remix server is stateless. Scale horizontally using Kubernetes (K8s) or Serverless (Cloudflare Workers).
-   **WebContainers**: Client-side execution dramatically reduces server load. Keep this architecture.

## 4. Monitoring & Observability
-   **Metrics**: Prometheus + Grafana for throughput/latency tracking.
-   **Tracing**: OpenTelemetry for end-to-end request tracing across agents.
