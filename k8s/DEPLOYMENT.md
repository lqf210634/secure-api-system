# Secure API System - Deployment Guide

This document provides comprehensive deployment instructions for the Secure API System using Helm charts.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment-Specific Deployments](#environment-specific-deployments)
- [Configuration](#configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

### Required Tools

- **Kubernetes cluster** (v1.20+)
- **Helm** (v3.8+)
- **kubectl** configured to access your cluster
- **Docker** (for building images)

### Cluster Requirements

- **Minimum resources**: 4 CPU cores, 8GB RAM
- **Storage**: Dynamic provisioning support
- **Ingress controller**: NGINX Ingress Controller
- **Certificate management**: cert-manager (for TLS)

### Helm Repositories

Add required Helm repositories:

```bash
# Add Bitnami repository for MySQL and Redis
helm repo add bitnami https://charts.bitnami.com/bitnami

# Add Prometheus community repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Add Grafana repository
helm repo add grafana https://grafana.github.io/helm-charts

# Add Elastic repository
helm repo add elastic https://helm.elastic.co

# Add NGINX Ingress repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Add cert-manager repository
helm repo add jetstack https://charts.jetstack.io

# Update repositories
helm repo update
```

## Quick Start

### 1. Install Dependencies

Install required infrastructure components:

```bash
# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Install cert-manager (for TLS certificates)
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

### 2. Deploy the Application

```bash
# Clone the repository
git clone <repository-url>
cd secure-api-system

# Deploy with default values
helm install secure-api-system ./k8s \
  --namespace secure-api \
  --create-namespace
```

### 3. Access the Application

```bash
# Get the application URL
kubectl get ingress -n secure-api

# Port-forward for local access (if ingress is not available)
kubectl port-forward -n secure-api svc/secure-api-system-frontend 8080:80
kubectl port-forward -n secure-api svc/secure-api-system-backend 8081:8080
```

## Environment-Specific Deployments

### Development Environment

```bash
# Deploy with development configuration
helm install secure-api-system ./k8s \
  --namespace secure-api-dev \
  --create-namespace \
  --values ./k8s/values-development.yaml \
  --set global.environment=development
```

### Production Environment

```bash
# Deploy with production configuration
helm install secure-api-system ./k8s \
  --namespace secure-api-prod \
  --create-namespace \
  --values ./k8s/values-production.yaml \
  --set global.environment=production \
  --set frontend.ingress.hosts[0].host=app.yourdomain.com \
  --set backend.ingress.hosts[0].host=api.yourdomain.com
```

### Staging Environment

```bash
# Deploy with staging configuration
helm install secure-api-system ./k8s \
  --namespace secure-api-staging \
  --create-namespace \
  --values ./k8s/values-production.yaml \
  --set global.environment=staging \
  --set frontend.replicaCount=2 \
  --set backend.replicaCount=3
```

## Configuration

### Database Configuration

#### Internal MySQL (Development)

```yaml
mysql:
  enabled: true
  auth:
    rootPassword: "your-root-password"
    database: "secure_api"
    username: "api_user"
    password: "your-password"
```

#### External MySQL (Production)

```yaml
mysql:
  enabled: false
  external:
    enabled: true
    host: "mysql.yourdomain.com"
    port: 3306
    database: "secure_api_prod"
    username: "api_user"
    # Set password via secret
```

### Redis Configuration

#### Internal Redis (Development)

```yaml
redis:
  enabled: true
  auth:
    enabled: false
```

#### External Redis (Production)

```yaml
redis:
  enabled: false
  external:
    enabled: true
    host: "redis.yourdomain.com"
    port: 6379
    # Set password via secret
```

### Secrets Management

Create secrets for sensitive data:

```bash
# Database credentials
kubectl create secret generic mysql-credentials \
  --from-literal=password=your-mysql-password \
  --namespace secure-api

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=password=your-redis-password \
  --namespace secure-api

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  --namespace secure-api

# Encryption key
kubectl create secret generic encryption-key \
  --from-literal=key=your-encryption-key \
  --namespace secure-api
```

### TLS Configuration

#### Automatic TLS with cert-manager

```yaml
tls:
  enabled: true
  issuer:
    enabled: true
    name: letsencrypt-prod
    email: "admin@yourdomain.com"

frontend:
  ingress:
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
    tls:
      - secretName: frontend-tls
        hosts:
          - app.yourdomain.com
```

#### Manual TLS

```bash
# Create TLS secret manually
kubectl create secret tls frontend-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace secure-api
```

## Monitoring and Logging

### Enable Monitoring

```yaml
monitoring:
  enabled: true
  
externalDependencies:
  prometheus:
    enabled: true
  grafana:
    enabled: true
```

### Access Grafana

```bash
# Get Grafana admin password
kubectl get secret --namespace secure-api grafana-admin-secret -o jsonpath="{.data.admin-password}" | base64 --decode

# Port-forward to access Grafana
kubectl port-forward --namespace secure-api svc/grafana 3000:80
```

### Enable Logging

```yaml
logging:
  enabled: true
  
externalDependencies:
  elasticsearch:
    enabled: true
  kibana:
    enabled: true
```

### Access Kibana

```bash
# Port-forward to access Kibana
kubectl port-forward --namespace secure-api svc/kibana 5601:5601
```

## Backup and Recovery

### Enable Backup

```yaml
backup:
  enabled: true
  database:
    schedule: "0 2 * * *"  # Daily at 2 AM
  redis:
    enabled: true
    schedule: "0 3 * * *"  # Daily at 3 AM
  s3:
    enabled: true
    bucket: "your-backup-bucket"
    region: "us-west-2"
```

### Manual Backup

```bash
# Trigger manual database backup
kubectl create job --from=cronjob/secure-api-system-database-backup manual-db-backup-$(date +%Y%m%d%H%M%S) -n secure-api

# Trigger manual Redis backup
kubectl create job --from=cronjob/secure-api-system-redis-backup manual-redis-backup-$(date +%Y%m%d%H%M%S) -n secure-api
```

### Restore from Backup

```bash
# List available backups
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- ls -la /backups/

# Restore database
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- /scripts/restore-database.sh /backups/database-backup-20231201.sql.gz

# Restore Redis
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- /scripts/restore-redis.sh /backups/redis-backup-20231201.rdb.gz
```

## Security

### Network Policies

Enable network policies for enhanced security:

```yaml
security:
  networkPolicy:
    enabled: true
    denyAll: true
    allowDNS: true
    allowHTTPS: true
```

### RBAC

Enable Role-Based Access Control:

```yaml
security:
  rbac:
    enabled: true
```

### Pod Security

Configure pod security policies:

```yaml
security:
  podSecurityPolicy:
    enabled: true
    allowPrivilegeEscalation: false
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n secure-api

# Describe problematic pod
kubectl describe pod <pod-name> -n secure-api

# Check logs
kubectl logs <pod-name> -n secure-api
```

#### 2. Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app.kubernetes.io/name=mysql -n secure-api

# Test database connection
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- nc -zv mysql-service 3306
```

#### 3. Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n secure-api

# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

#### 4. Certificate Issues

```bash
# Check certificate status
kubectl get certificates -n secure-api

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

### Health Checks

```bash
# Check application health
curl -k https://api.yourdomain.com/actuator/health

# Check frontend health
curl -k https://app.yourdomain.com/health

# Check all pods health
kubectl get pods -n secure-api -o wide
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n secure-api
kubectl top nodes

# Check HPA status
kubectl get hpa -n secure-api

# Check metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/secure-api/pods
```

## Maintenance

### Upgrading the Application

```bash
# Update Helm chart
helm upgrade secure-api-system ./k8s \
  --namespace secure-api \
  --values ./k8s/values-production.yaml

# Check rollout status
kubectl rollout status deployment/secure-api-system-frontend -n secure-api
kubectl rollout status deployment/secure-api-system-backend -n secure-api
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment secure-api-system-backend --replicas=10 -n secure-api

# Update HPA
kubectl patch hpa secure-api-system-backend -n secure-api -p '{"spec":{"maxReplicas":20}}'
```

### Database Maintenance

```bash
# Access MySQL shell
kubectl exec -it deployment/mysql -n secure-api -- mysql -u root -p

# Run database migrations
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- java -jar app.jar --spring.profiles.active=migration
```

### Log Management

```bash
# Clean old logs
kubectl exec -it deployment/secure-api-system-backend -n secure-api -- find /var/log -name "*.log" -mtime +7 -delete

# Rotate logs manually
kubectl create job --from=cronjob/log-rotation manual-log-rotation-$(date +%Y%m%d%H%M%S) -n secure-api
```

### Monitoring Maintenance

```bash
# Clean old metrics
kubectl exec -it deployment/prometheus -n secure-api -- promtool query instant 'up'

# Restart monitoring components
kubectl rollout restart deployment/prometheus -n secure-api
kubectl rollout restart deployment/grafana -n secure-api
```

## Best Practices

### 1. Resource Management

- Always set resource requests and limits
- Use horizontal pod autoscaling for variable workloads
- Monitor resource usage regularly

### 2. Security

- Use network policies to restrict traffic
- Enable RBAC and pod security policies
- Regularly update container images
- Use secrets for sensitive data

### 3. High Availability

- Deploy across multiple availability zones
- Use pod disruption budgets
- Implement proper health checks
- Configure appropriate replica counts

### 4. Backup Strategy

- Automate regular backups
- Test restore procedures regularly
- Store backups in multiple locations
- Monitor backup job status

### 5. Monitoring

- Set up comprehensive alerting
- Monitor application and infrastructure metrics
- Use distributed tracing for complex issues
- Implement log aggregation

## Support

For additional support:

- Check the [README.md](./README.md) for basic information
- Review Kubernetes and Helm documentation
- Check application logs for specific errors
- Contact the development team for application-specific issues