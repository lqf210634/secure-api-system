# Pull Request

## 📋 Description
<!-- Provide a brief description of the changes in this PR -->

## 🔗 Related Issues
<!-- Link to related issues using keywords like "Closes #123" or "Fixes #456" -->
- Closes #
- Related to #

## 🚀 Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security improvement
- [ ] 🧪 Test improvement
- [ ] 🔨 Build/CI improvement
- [ ] 🎨 Style/formatting changes

## 🧪 Testing
<!-- Describe the tests you ran and how to reproduce them -->

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### Test Results
<!-- Paste test results or screenshots if applicable -->

## 📸 Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain your changes -->

## 🔍 Code Quality Checklist
<!-- Ensure your code meets our quality standards -->

### General
- [ ] Code follows the project's coding standards
- [ ] Self-review of the code completed
- [ ] Code is properly commented, particularly in hard-to-understand areas
- [ ] No debugging code or console logs left in the code
- [ ] No TODO comments added (or existing ones addressed)

### Security
- [ ] No sensitive information (passwords, keys, tokens) exposed
- [ ] Input validation implemented where necessary
- [ ] SQL injection prevention measures in place
- [ ] XSS prevention measures in place
- [ ] Authentication and authorization properly implemented

### Performance
- [ ] No obvious performance bottlenecks introduced
- [ ] Database queries optimized
- [ ] Caching implemented where appropriate
- [ ] Large files/assets optimized

### Documentation
- [ ] README updated if necessary
- [ ] API documentation updated if necessary
- [ ] Inline code documentation added/updated
- [ ] Migration guides provided for breaking changes

## 🔄 Database Changes
<!-- If applicable, describe any database schema changes -->
- [ ] No database changes
- [ ] Database migration scripts included
- [ ] Migration scripts tested
- [ ] Rollback plan documented

## 🌍 Environment Impact
<!-- Check all environments this change affects -->
- [ ] Development
- [ ] Staging
- [ ] Production

### Configuration Changes
- [ ] No configuration changes required
- [ ] Environment variables added/modified (documented in PR description)
- [ ] Configuration files updated
- [ ] Secrets/credentials updated (coordinate with DevOps team)

## 📦 Dependencies
<!-- List any new dependencies or dependency updates -->
- [ ] No new dependencies
- [ ] New dependencies added (justify in description)
- [ ] Dependencies updated (breaking changes noted)
- [ ] Security vulnerabilities in dependencies addressed

## 🚀 Deployment Notes
<!-- Special instructions for deployment -->
- [ ] No special deployment steps required
- [ ] Requires database migration
- [ ] Requires configuration updates
- [ ] Requires cache clearing
- [ ] Requires service restart
- [ ] Requires coordination with other teams

### Rollback Plan
<!-- Describe how to rollback this change if needed -->

## 👥 Review Checklist
<!-- For reviewers -->

### Code Review
- [ ] Code logic is sound and efficient
- [ ] Error handling is appropriate
- [ ] Code is readable and maintainable
- [ ] No code smells or anti-patterns
- [ ] Security considerations addressed

### Testing Review
- [ ] Test coverage is adequate
- [ ] Tests are meaningful and not just for coverage
- [ ] Edge cases are covered
- [ ] Error scenarios are tested

### Documentation Review
- [ ] Documentation is clear and accurate
- [ ] Examples are provided where helpful
- [ ] Breaking changes are clearly documented

## 🏷️ Labels
<!-- Suggested labels for this PR -->
- Component: `backend` / `frontend` / `infrastructure` / `documentation`
- Priority: `low` / `medium` / `high` / `critical`
- Size: `small` / `medium` / `large` / `xl`

## 📝 Additional Notes
<!-- Any additional information that reviewers should know -->

---

### Reviewer Guidelines
- Please review both the code and the testing approach
- Check for security implications
- Verify that documentation is updated
- Ensure CI/CD pipeline passes
- Test the changes in a staging environment if possible

### Merge Requirements
- [ ] All CI/CD checks pass
- [ ] At least 2 approvals from code owners
- [ ] Security review completed (if applicable)
- [ ] Documentation review completed (if applicable)
- [ ] QA testing completed (if applicable)