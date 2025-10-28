# Branch Protection Rules and Merge Strategies

This document outlines the recommended branch protection rules and merge strategies for the secure-api-system repository.

## 🛡️ Branch Protection Rules

### Main Branch (`main`)

**Required Status Checks:**
- ✅ CI/CD Pipeline / backend-test
- ✅ CI/CD Pipeline / frontend-test  
- ✅ CI/CD Pipeline / security-scan
- ✅ Advanced Security Scanning / codeql-analysis
- ✅ Advanced Security Scanning / semgrep-scan
- ✅ Advanced Security Scanning / container-security
- ✅ Advanced Security Scanning / dependency-scan

**Protection Settings:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging
  - Required number of reviewers: **2**
  - Dismiss stale reviews when new commits are pushed: **Yes**
  - Require review from code owners: **Yes**
  - Require approval of the most recent reviewable push: **Yes**
- ✅ Require conversation resolution before merging
- ✅ Require signed commits
- ✅ Require linear history
- ✅ Include administrators in these restrictions
- ✅ Allow force pushes: **No**
- ✅ Allow deletions: **No**

### Develop Branch (`develop`)

**Required Status Checks:**
- ✅ CI/CD Pipeline / backend-test
- ✅ CI/CD Pipeline / frontend-test
- ✅ CI/CD Pipeline / security-scan

**Protection Settings:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging
  - Required number of reviewers: **1**
  - Dismiss stale reviews when new commits are pushed: **Yes**
  - Require review from code owners: **No**
- ✅ Require conversation resolution before merging
- ✅ Include administrators in these restrictions
- ✅ Allow force pushes: **No**
- ✅ Allow deletions: **No**

### Release Branches (`release/*`)

**Required Status Checks:**
- ✅ CI/CD Pipeline / backend-test
- ✅ CI/CD Pipeline / frontend-test
- ✅ CI/CD Pipeline / security-scan
- ✅ Advanced Security Scanning / codeql-analysis

**Protection Settings:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging
  - Required number of reviewers: **2**
  - Require review from code owners: **Yes**
- ✅ Require conversation resolution before merging
- ✅ Include administrators in these restrictions

## 🔀 Merge Strategies

### Main Branch
- **Strategy**: Squash and merge
- **Rationale**: Maintains clean commit history, easier to track features and fixes
- **Commit Message Format**: `type(scope): description (#PR-number)`

### Develop Branch  
- **Strategy**: Create a merge commit
- **Rationale**: Preserves feature branch history for development tracking
- **Commit Message Format**: Standard merge commit messages

### Feature Branches → Develop
- **Strategy**: Squash and merge (recommended) or Create a merge commit
- **Rationale**: Flexible based on feature complexity

### Hotfix Branches → Main
- **Strategy**: Squash and merge
- **Rationale**: Clean history for critical fixes

## 👥 Code Owners

Create a `.github/CODEOWNERS` file with the following structure:

```
# Global owners
* @team-leads @security-team

# Backend code
/backend/ @backend-team @security-team
/backend/src/main/java/com/example/security/ @security-team
/backend/pom.xml @backend-team @devops-team

# Frontend code  
/frontend/ @frontend-team @security-team
/frontend/src/components/auth/ @security-team
/frontend/package*.json @frontend-team @devops-team

# Infrastructure and DevOps
/.github/ @devops-team @security-team
/k8s/ @devops-team @security-team
/scripts/ @devops-team
/monitoring/ @devops-team @sre-team
Dockerfile @devops-team @security-team
docker-compose*.yml @devops-team

# Documentation
*.md @tech-writers @team-leads
/docs/ @tech-writers

# Security-sensitive files
/backend/src/main/resources/application*.yml @security-team @backend-team
/frontend/.env* @security-team @frontend-team
```

## 🚀 Automated Merge Requirements

### Required Checks Matrix

| Branch Type | Unit Tests | Integration Tests | Security Scan | Code Quality | Performance | Documentation |
|-------------|------------|-------------------|---------------|--------------|-------------|---------------|
| `main` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `develop` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ⚠️ Optional | ⚠️ Optional |
| `feature/*` | ✅ Required | ⚠️ Optional | ✅ Required | ✅ Required | ⚠️ Optional | ⚠️ Optional |
| `hotfix/*` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ⚠️ Optional | ⚠️ Optional |
| `release/*` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

## 📋 Pull Request Requirements

### All Pull Requests Must Include:
- [ ] Clear description of changes
- [ ] Link to related issues
- [ ] Test coverage for new code
- [ ] Updated documentation (if applicable)
- [ ] Security impact assessment
- [ ] Performance impact assessment

### Large Pull Requests (>500 lines) Must Include:
- [ ] Design document or RFC
- [ ] Migration plan (if applicable)
- [ ] Rollback plan
- [ ] Staged rollout plan

## 🔒 Security Requirements

### Security-Sensitive Changes Require:
- [ ] Security team review
- [ ] Penetration testing (for major changes)
- [ ] Security documentation updates
- [ ] Threat model updates (if applicable)

### Files Requiring Security Review:
- Authentication/authorization code
- Database schema changes
- API endpoint changes
- Configuration files
- Dockerfile and deployment scripts
- CI/CD pipeline changes

## 🎯 Quality Gates

### Code Quality Thresholds:
- **Test Coverage**: Minimum 80% for new code
- **Code Duplication**: Maximum 3%
- **Complexity**: Maximum cyclomatic complexity of 10
- **Security**: No high or critical security vulnerabilities
- **Performance**: No performance regressions >10%

### Automated Quality Checks:
- SonarQube quality gate
- ESLint/TSLint for frontend
- SpotBugs/PMD for backend
- OWASP dependency check
- Container security scanning

## 📊 Monitoring and Metrics

### Branch Health Metrics:
- Average time to merge
- Number of failed builds
- Security vulnerability count
- Test coverage trends
- Code review turnaround time

### Alerts and Notifications:
- Failed security scans
- Dependency vulnerabilities
- Build failures on protected branches
- Long-running pull requests (>7 days)

## 🔄 Emergency Procedures

### Hotfix Process:
1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track review process (1 reviewer minimum)
4. Deploy to staging for verification
5. Merge to `main` and `develop`
6. Tag release and deploy to production

### Security Incident Response:
1. Create private security branch
2. Implement security fix
3. Security team review
4. Coordinate disclosure timeline
5. Deploy fix across all environments
6. Post-incident review and documentation

---

## 📝 Implementation Checklist

To implement these branch protection rules:

1. **Repository Settings**:
   - Go to Settings → Branches
   - Add rules for each protected branch
   - Configure required status checks
   - Set up review requirements

2. **GitHub Apps/Integrations**:
   - Enable Dependabot
   - Configure CodeQL
   - Set up SonarQube integration
   - Configure Slack/Teams notifications

3. **Team Configuration**:
   - Create GitHub teams
   - Assign team members
   - Configure CODEOWNERS file
   - Set up review assignments

4. **Monitoring Setup**:
   - Configure branch protection monitoring
   - Set up quality gate alerts
   - Create dashboards for metrics
   - Configure incident response workflows