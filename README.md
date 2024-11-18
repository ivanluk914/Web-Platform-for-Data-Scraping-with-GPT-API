# Admin API Project

## Overview

This project is a web scraping automation platform that allows users to schedule and manage data collection tasks from websites. Built with Go and React, it features:

- Intelligent data extraction using GPT for parsing and summarizing scraped content
- Flexible scheduling options (one-time, daily, weekly, monthly)
- Multiple output formats (JSON, CSV, Markdown)
- Real-time task monitoring and management
- Automated data collection with customizable targets and keywords

The platform combines modern cloud-native technologies with AI-powered scraping capabilities to provide reliable, scalable web data extraction services.

## Key Features

- **Go-based API**: High-performance backend using the Gin web framework
- **Auth0 Integration**: Secure user management and authentication
- **Database Stack**:
  - PostgreSQL: Primary relational database
  - Redis: Caching and session management
  - ScyllaDB: High-performance NoSQL database for specific use cases
- **Observability Suite**:
  - OpenTelemetry: For distributed tracing and metrics collection
  - Grafana: Unified dashboarding for metrics, logs, and traces
  - Prometheus: Metrics storage and querying
  - Jaeger/Tempo: Distributed tracing visualization
  - Loki: Log aggregation and querying
- **Docker Compose**: Easy local development and deployment

## Requirements

Ensure you have the following installed:

- Docker and Docker Compose
- Go 1.23 or later (optional, for local backend development)
- Node.js (for frontend development)
- pnpm: `curl -fsSL https://get.pnpm.io/install.sh | sh -`
- Terraform (optional, for infrastructure management)

## Quick Start

### Backend

1. Fetch client id and client secret from Auth0 dashboard and set to .env file:

```sh
cp .env.example .env
```

2. Start the backend services:

```sh
make start
```

This command starts all necessary services: API, databases, and observability tools.

3. The API will be available at `http://localhost:8080`

4. View logs:

```sh
make logs
```

or visit Grafana dashboard: http://localhost:3000/

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

Access the following URL for monitoring and debugging:

- Grafana (Metrics, Logs, Traces): http://localhost:3000/

## API Documentation

### Admin API Endpoints

#### User Management
- **GET** `/api/user` - List all users (paginated)
  - Query params: `page`, `pageSize`
  - Returns: List of users with pagination metadata
  
- **GET** `/api/user/:userId` - Get user details
  - Returns: User details including roles

- **PUT** `/api/user/:userId` - Update user details
  - Body: User object with updated fields
  
- **DELETE** `/api/user/:userId` - Delete a user

- **GET** `/api/user/:userId/roles` - List user roles
- **POST** `/api/user/:userId/roles` - Assign role to user
  - Body: `{ "role": "ROLE_NAME" }`
- **DELETE** `/api/user/:userId/roles` - Remove role from user
  - Body: `{ "role": "ROLE_NAME" }`

#### Task Management
- **GET** `/api/task` - List all tasks
- **GET** `/api/user/:userId/task` - List user's tasks
- **GET** `/api/user/:userId/task/:taskId` - Get task details
- **POST** `/api/user/:userId/task` - Create new task
- **PUT** `/api/user/:userId/task/:taskId` - Update task
- **DELETE** `/api/user/:userId/task/:taskId` - Delete task

- **GET** `/api/user/:userId/task/:taskId/run` - List task runs
- **POST** `/api/user/:userId/task/:taskId/run` - Create task run
- **GET** `/api/user/:userId/task/:taskId/run/:runId` - Get task run details
- **PUT** `/api/user/:userId/task/:taskId/run/:runId` - Update task run

- **GET** `/api/user/:userId/task/:taskId/run/:runId/artifact` - List task run artifacts
- **POST** `/api/user/:userId/task/:taskId/run/:runId/artifact` - Create task run artifact

### Scraper API Endpoints

- **POST** `/api/user/:userId/task` - Preview scrape task
  - Body:
    ```json
    {
      "taskName": "string",
      "sourceURL": "string",
      "keywords": ["string"],
      "outputFormat": "JSON|CSV|MARKDOWN",
      "dataTypes": ["string"]
    }
    ```

- **PUT** `/api/user/:userId/task/:taskId` - Schedule scrape task
  - Body: Task details including schedule configuration

- **PUT** `/api/user/:userId/task/:taskId/summary` - Generate task summary
  - Body: Task details with full response

- **PUT** `/api/user/:userId/task/:taskId/cancel` - Cancel scheduled task

## Development Workflow

1. Make changes to the Go code in the `backend/admin-api` directory
2. The API service in Docker Compose is set up for hot-reloading, so changes will be reflected immediately
3. Run tests: `go test ./...`
4. Submit a pull request with your changes

## Logging

The application uses structured JSON logging with Zap. Logs are collected by the Otel-Collector and can be queried in Grafana using LogQL.

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

## API Response Formats

#### User Object
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "picture": "string",
  "roles": ["string"]
}
```

#### Task Object
```json
{
  "id": "string",
  "userId": "string",
  "taskName": "string",
  "status": "number",
  "taskDefinition": {
    "source": [{
      "url": "string"
    }],
    "target": [{
      "name": "string",
      "value": "string"
    }],
    "output": [{
      "type": "number",
      "value": "string"
    }],
    "period": "number"
  }
}
```
