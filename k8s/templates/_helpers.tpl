{{/*
Expand the name of the chart.
*/}}
{{- define "secure-api-system.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "secure-api-system.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "secure-api-system.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "secure-api-system.labels" -}}
helm.sh/chart: {{ include "secure-api-system.chart" . }}
{{ include "secure-api-system.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "secure-api-system.selectorLabels" -}}
app.kubernetes.io/name: {{ include "secure-api-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "secure-api-system.frontend.labels" -}}
{{ include "secure-api-system.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "secure-api-system.frontend.selectorLabels" -}}
{{ include "secure-api-system.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Backend labels
*/}}
{{- define "secure-api-system.backend.labels" -}}
{{ include "secure-api-system.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "secure-api-system.backend.selectorLabels" -}}
{{ include "secure-api-system.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "secure-api-system.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "secure-api-system.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the image name for frontend
*/}}
{{- define "secure-api-system.frontend.image" -}}
{{- if .Values.global.imageRegistry }}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .Values.frontend.image.repository (.Values.frontend.image.tag | default .Values.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.frontend.image.repository (.Values.frontend.image.tag | default .Values.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Create the image name for backend
*/}}
{{- define "secure-api-system.backend.image" -}}
{{- if .Values.global.imageRegistry }}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .Values.backend.image.repository (.Values.backend.image.tag | default .Values.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.backend.image.repository (.Values.backend.image.tag | default .Values.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Create the MySQL connection string
*/}}
{{- define "secure-api-system.mysql.connectionString" -}}
{{- if .Values.mysql.enabled }}
{{- printf "jdbc:mysql://%s:%d/%s" (include "mysql.primary.fullname" .Subcharts.mysql) (.Values.mysql.primary.service.ports.mysql | int) .Values.mysql.auth.database }}
{{- else }}
{{- printf "jdbc:mysql://%s:%d/%s" .Values.externalDatabase.host (.Values.externalDatabase.port | int) .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{/*
Create the Redis connection string
*/}}
{{- define "secure-api-system.redis.host" -}}
{{- if .Values.redis.enabled }}
{{- include "redis.fullname" .Subcharts.redis }}
{{- else }}
{{- .Values.externalRedis.host }}
{{- end }}
{{- end }}

{{/*
Create the Redis port
*/}}
{{- define "secure-api-system.redis.port" -}}
{{- if .Values.redis.enabled }}
{{- .Values.redis.master.service.ports.redis | default 6379 }}
{{- else }}
{{- .Values.externalRedis.port | default 6379 }}
{{- end }}
{{- end }}

{{/*
Create the namespace name
*/}}
{{- define "secure-api-system.namespace" -}}
{{- default .Release.Namespace .Values.namespace }}
{{- end }}

{{/*
Create the ingress class name
*/}}
{{- define "secure-api-system.ingressClassName" -}}
{{- .Values.ingress.className | default "nginx" }}
{{- end }}

{{/*
Create the storage class name
*/}}
{{- define "secure-api-system.storageClassName" -}}
{{- .Values.storage.className | default "standard" }}
{{- end }}

{{/*
Create the monitoring namespace
*/}}
{{- define "secure-api-system.monitoring.namespace" -}}
{{- .Values.monitoring.namespace | default (printf "%s-monitoring" (include "secure-api-system.namespace" .)) }}
{{- end }}

{{/*
Create the logging namespace
*/}}
{{- define "secure-api-system.logging.namespace" -}}
{{- .Values.logging.namespace | default (printf "%s-logging" (include "secure-api-system.namespace" .)) }}
{{- end }}

{{/*
Create the backup storage class
*/}}
{{- define "secure-api-system.backup.storageClassName" -}}
{{- .Values.backup.storageClassName | default "standard" }}
{{- end }}

{{/*
Create the TLS secret name
*/}}
{{- define "secure-api-system.tls.secretName" -}}
{{- printf "%s-tls" (include "secure-api-system.fullname" .) }}
{{- end }}

{{/*
Create the certificate issuer name
*/}}
{{- define "secure-api-system.certificate.issuer" -}}
{{- .Values.certificates.issuer | default "letsencrypt-staging" }}
{{- end }}

{{/*
Create resource limits
*/}}
{{- define "secure-api-system.resources" -}}
{{- if .resources }}
resources:
  {{- if .resources.limits }}
  limits:
    {{- if .resources.limits.cpu }}
    cpu: {{ .resources.limits.cpu }}
    {{- end }}
    {{- if .resources.limits.memory }}
    memory: {{ .resources.limits.memory }}
    {{- end }}
  {{- end }}
  {{- if .resources.requests }}
  requests:
    {{- if .resources.requests.cpu }}
    cpu: {{ .resources.requests.cpu }}
    {{- end }}
    {{- if .resources.requests.memory }}
    memory: {{ .resources.requests.memory }}
    {{- end }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Create node selector
*/}}
{{- define "secure-api-system.nodeSelector" -}}
{{- if .nodeSelector }}
nodeSelector:
  {{- toYaml .nodeSelector | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create affinity rules
*/}}
{{- define "secure-api-system.affinity" -}}
{{- if .affinity }}
affinity:
  {{- toYaml .affinity | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create tolerations
*/}}
{{- define "secure-api-system.tolerations" -}}
{{- if .tolerations }}
tolerations:
  {{- toYaml .tolerations | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create security context
*/}}
{{- define "secure-api-system.securityContext" -}}
{{- if .Values.security.podSecurityPolicy.enabled }}
securityContext:
  runAsNonRoot: true
  runAsUser: {{ .Values.security.podSecurityPolicy.securityContext.runAsUser | default 1000 }}
  runAsGroup: {{ .Values.security.podSecurityPolicy.securityContext.runAsGroup | default 1000 }}
  fsGroup: {{ .Values.security.podSecurityPolicy.securityContext.fsGroup | default 1000 }}
  {{- if .Values.security.podSecurityPolicy.securityContext.readOnlyRootFilesystem }}
  readOnlyRootFilesystem: {{ .Values.security.podSecurityPolicy.securityContext.readOnlyRootFilesystem }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Create container security context
*/}}
{{- define "secure-api-system.containerSecurityContext" -}}
{{- if .Values.security.podSecurityPolicy.enabled }}
securityContext:
  allowPrivilegeEscalation: {{ .Values.security.podSecurityPolicy.securityContext.allowPrivilegeEscalation | default false }}
  readOnlyRootFilesystem: {{ .Values.security.podSecurityPolicy.securityContext.readOnlyRootFilesystem | default true }}
  runAsNonRoot: true
  runAsUser: {{ .Values.security.podSecurityPolicy.securityContext.runAsUser | default 1000 }}
  runAsGroup: {{ .Values.security.podSecurityPolicy.securityContext.runAsGroup | default 1000 }}
  capabilities:
    drop:
    {{- range .Values.security.podSecurityPolicy.securityContext.capabilities.drop }}
    - {{ . }}
    {{- end }}
{{- end }}
{{- end }}