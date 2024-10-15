#!/bin/bash

ENVIRONMENT=${ENVIRONMENT:-local}

helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaeger https://jaegertracing.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo add jetstack https://charts.jetstack.io
helm repo add scylla https://scylla-operator-charts.storage.googleapis.com/stable
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.16.1 \
  --set crds.enabled=true

# Wait for cert-manager to be ready
kubectl wait -n cert-manager --for=condition=ready pod -l app=cert-manager --timeout=60s

# Install opentelemetry operator
helm upgrade --install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --set "manager.collectorImage.repository=otel/opentelemetry-collector-k8s"

# Install postgres operator
helm upgrade --install cpk infra/helm/pgo --create-namespace --namespace pgo-operator

# Install scylla operator
helm upgrade --install scylla-operator scylla/scylla-operator --create-namespace --namespace scylla-operator
helm upgrade --install scylla-manager scylla/scylla-manager --create-namespace --namespace scylla-manager

# Install monitoring
helm upgrade --install monitoring infra/helm/monitoring -f infra/helm/monitoring/values.yaml -f infra/helm/monitoring/environments/${ENVIRONMENT}/values.yaml --create-namespace --namespace monitoring

# Install admin-api
helm dependency build infra/helm/admin-api
helm upgrade --install admin-api infra/helm/admin-api -f infra/helm/admin-api/values.yaml -f infra/helm/admin-api/environments/${ENVIRONMENT}/values.yaml --create-namespace --namespace admin-api

echo "### Cluster bootstrapped successfully ###"