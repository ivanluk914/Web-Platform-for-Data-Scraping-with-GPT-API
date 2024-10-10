# Admin API Project

## Overview

This project is a robust, scalable Admin API built with Go, leveraging modern cloud-native technologies and best practices for observability, performance, and reliability.

## Key Features

- **Go-based API**: High-performance backend using the Gin web framework
- **Auth0 Integration**: Secure user management and authentication
- **Database Stack**:
  - PostgreSQL: Primary relational database
  - Redis: Caching and session management
  - ScyllaDB: High-performance NoSQL database for specific use cases
- **Observability Suite**:
  - OpenTelemetry: For distributed tracing and metrics collection
  - Prometheus: Metrics storage and querying
  - Jaeger: Distributed tracing visualization
  - Loki: Log aggregation and querying
  - Grafana: Unified dashboarding for metrics, logs, and traces
- **Docker Compose**: Easy local development and deployment

## Requirements

Ensure you have the following installed:

- Docker and Docker Compose
- Go 1.21 or later
- Node.js (for frontend development)
- pnpm: `curl -fsSL https://get.pnpm.io/install.sh | sh -`
- Terraform (for infrastructure management)

## Quick Start

### Backend

1. Start the backend services:

```sh
docker-compose up --build
```

This command starts all necessary services: API, databases, and observability tools.

2. The API will be available at `http://localhost:8080`

### Frontend (if applicable)

1. Install dependencies:

```sh
pnpm install
```

2. Start the development server:

```sh
pnpm run dev
```

## Observability

Access the following UIs for monitoring and debugging:

- Grafana (Metrics, Logs, Traces): http://localhost:3000/
- Jaeger (Distributed Tracing): http://localhost:16686/
- Prometheus (Metrics): http://localhost:9090/

## API Documentation

[TODO: Add link to API documentation or describe how to access it]

## Development Workflow

1. Make changes to the Go code in the `backend/admin-api` directory
2. The API service in Docker Compose is set up for hot-reloading, so changes will be reflected immediately
3. Run tests: [TODO: Add instructions for running tests]
4. Submit a pull request with your changes

## Logging

The application uses structured JSON logging with Zap. Logs are collected by Promtail and can be queried in Grafana using LogQL.

Example LogQL query:
```
{container=~".*api.*"}
```

## Metrics

Custom metrics can be added using the OpenTelemetry SDK. Metrics are exported to Prometheus and can be visualized in Grafana.

## Tracing

Distributed tracing is implemented using OpenTelemetry and can be visualized in Jaeger or Grafana.

## Infrastructure

Infrastructure is managed using Terraform. Refer to the `infra` directory for details.
