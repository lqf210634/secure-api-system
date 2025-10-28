# Secure API System Helm Chart

A comprehensive Helm chart for deploying a secure API system with frontend, backend, database, monitoring, logging, and backup capabilities.

## Overview

This Helm chart deploys a complete secure API system that includes:

- **Frontend**: React-based web application
- **Backend**: Spring Boot API server with security features
- **Database**: MySQL for persistent data storage
- **Cache**: Redis for session management and caching
- **Monitoring**: Prometheus and Grafana for metrics and alerting
- **Logging**: Elasticsearch, Fluent Bit, and Kibana for log aggregation
- **Backup**: Automated database and Redis backup with S3 support
- **Security**: Network policies, RBAC, and security testing
- **Testing**: Performance and security testing capabilities

## Prerequisites

- Kubernetes 1.20+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure
- Ingress controller (nginx recommended)

## Installation

### Quick Start

```bash
# Add the repository (if published)
helm repo add secure-api-system https://charts.secure-api-system.com
helm repo update

# Install with default values
helm install my-secure-api secure-api-system/secure-api-system

# Or install from local chart
helm install my-secure-api ./k8s
```

### Custom Installation

```bash
# Install with custom values
helm install my-secure-api ./k8s -f values-production.yaml

# Install in specific namespace
helm install my-secure-api ./k8s --namespace secure-api --create-namespace

# Install with inline value overrides
helm install my-secure-api ./k8s \
  --set frontend.replicaCount=3 \
  --set backend.replicaCount=5 \
  --set monitoring.enabled=true
```

## Configuration

### Core Components

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment name | `production` |
| `global.storageClass` | Default storage class | `""` |
| `global.imageRegistry` | Global image registry | `""` |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of frontend replicas | `2` |
| `frontend.image.repository` | Frontend image repository | `secure-api-system/frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.service.port` | Frontend service port | `80` |
| `frontend.ingress.enabled` | Enable frontend ingress | `true` |
| `frontend.ingress.hosts[0].host` | Frontend hostname | `secure-api.local` |

### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Number of backend replicas | `3` |
| `backend.image.repository` | Backend image repository | `secure-api-system/backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.service.port` | Backend service port | `8080` |
| `backend.autoscaling.enabled` | Enable HPA for backend | `true` |
| `backend.autoscaling.minReplicas` | Minimum replicas | `3` |
| `backend.autoscaling.maxReplicas` | Maximum replicas | `20` |

### Database Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mysql.enabled` | Enable MySQL deployment | `true` |
| `mysql.host` | MySQL host (if external) | `""` |
| `mysql.port` | MySQL port | `3306` |
| `mysql.database` | Database name | `secure_api_db` |
| `mysql.username` | Database username | `api_user` |
| `mysql.password` | Database password | `""` |

### Redis Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Enable Redis deployment | `true` |
| `redis.host` | Redis host (if external) | `""` |
| `redis.port` | Redis port | `6379` |
| `redis.password` | Redis password | `""` |

### Security Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `security.rbac.enabled` | Enable RBAC | `true` |
| `security.networkPolicy.enabled` | Enable network policies | `true` |
| `security.networkPolicy.denyAll` | Default deny all traffic | `true` |
| `serviceAccount.create` | Create service account | `true` |
| `serviceAccount.automountServiceAccountToken` | Auto-mount SA token | `false` |

### Monitoring Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `monitoring.enabled` | Enable monitoring | `true` |
| `monitoring.scrapeInterval` | Prometheus scrape interval | `30s` |
| `monitoring.alerts.errorRate.threshold` | Error rate alert threshold | `5` |
| `monitoring.alerts.responseTime.threshold` | Response time alert threshold | `1` |
| `monitoring.alerts.memoryUsage.threshold` | Memory usage alert threshold | `80` |

### Logging Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `logging.enabled` | Enable logging | `true` |
| `logging.elasticsearch.enabled` | Enable Elasticsearch | `true` |
| `logging.elasticsearch.host` | Elasticsearch host | `elasticsearch` |
| `logging.elasticsearch.port` | Elasticsearch port | `9200` |
| `logging.kibana.enabled` | Enable Kibana dashboard | `true` |
| `logging.logRotation.enabled` | Enable log rotation | `true` |

### Backup Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backup.enabled` | Enable backup | `true` |
| `backup.database.schedule` | Database backup schedule | `0 2 * * *` |
| `backup.redis.enabled` | Enable Redis backup | `true` |
| `backup.redis.schedule` | Redis backup schedule | `0 3 * * *` |
| `backup.s3.enabled` | Enable S3 backup | `false` |
| `backup.s3.bucket` | S3 bucket name | `""` |
| `backup.verification.enabled` | Enable backup verification | `true` |

### Testing Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `testing.performance.enabled` | Enable performance testing | `false` |
| `testing.performance.virtualUsers` | Number of virtual users | `10` |
| `testing.performance.duration` | Test duration | `5m` |
| `testing.security.enabled` | Enable security testing | `false` |
| `testing.security.passive` | Use passive scanning | `false` |

## Usage Examples

### Production Deployment

```yaml
# values-production.yaml
global:
  environment: production
  storageClass: "fast-ssd"

frontend:
  replicaCount: 3
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

backend:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 50
  resources:
    requests:
      cpu: 1000m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 2Gi

monitoring:
  enabled: true
  alerts:
    errorRate:
      threshold: 1
    responseTime:
      threshold: 0.5

backup:
  enabled: true
  s3:
    enabled: true
    bucket: "my-production-backups"
    region: "us-west-2"

security:
  networkPolicy:
    enabled: true
    denyAll: true
```

### Development Deployment

```yaml
# values-development.yaml
global:
  environment: development

frontend:
  replicaCount: 1

backend:
  replicaCount: 1
  autoscaling:
    enabled: false

monitoring:
  enabled: false

logging:
  enabled: false

backup:
  enabled: false

testing:
  performance:
    enabled: true
  security:
    enabled: true
```

### Monitoring Only

```yaml
# values-monitoring.yaml
frontend:
  enabled: false

backend:
  enabled: false

mysql:
  enabled: false

redis:
  enabled: false

monitoring:
  enabled: true

logging:
  enabled: true
```

## Upgrading

```bash
# Upgrade to new version
helm upgrade my-secure-api ./k8s

# Upgrade with new values
helm upgrade my-secure-api ./k8s -f values-production.yaml

# Force upgrade
helm upgrade my-secure-api ./k8s --force
```

## Uninstalling

```bash
# Uninstall the release
helm uninstall my-secure-api

# Uninstall and delete namespace
helm uninstall my-secure-api --namespace secure-api
kubectl delete namespace secure-api
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl get pods -n secure-api
   kubectl describe pod <pod-name> -n secure-api
   kubectl logs <pod-name> -n secure-api
   ```

2. **Database connection issues**
   ```bash
   kubectl exec -it <backend-pod> -n secure-api -- env | grep -i mysql
   kubectl port-forward svc/mysql 3306:3306 -n secure-api
   ```

3. **Ingress not working**
   ```bash
   kubectl get ingress -n secure-api
   kubectl describe ingress secure-api-frontend -n secure-api
   ```

4. **Monitoring not collecting metrics**
   ```bash
   kubectl get servicemonitor -n secure-api
   kubectl port-forward svc/prometheus 9090:9090 -n secure-api
   ```

### Health Checks

```bash
# Check application health
kubectl get pods -l app.kubernetes.io/name=secure-api-system

# Check services
kubectl get svc -l app.kubernetes.io/name=secure-api-system

# Check ingress
kubectl get ingress

# Check persistent volumes
kubectl get pv,pvc
```

### Performance Testing

```bash
# Run performance test
helm test my-secure-api --filter name=performance-test

# Check test results
kubectl logs job/secure-api-system-performance-test
```

### Security Testing

```bash
# Run security test
helm test my-secure-api --filter name=security-test

# Check security scan results
kubectl logs job/secure-api-system-security-test
```

## Development

### Local Development

```bash
# Install dependencies
helm dependency update

# Lint the chart
helm lint .

# Template the chart
helm template my-secure-api . --debug

# Test the chart
helm test my-secure-api
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://docs.secure-api-system.com](https://docs.secure-api-system.com)
- Issues: [https://github.com/secure-api-system/secure-api-system/issues](https://github.com/secure-api-system/secure-api-system/issues)
- Discussions: [https://github.com/secure-api-system/secure-api-system/discussions](https://github.com/secure-api-system/secure-api-system/discussions)