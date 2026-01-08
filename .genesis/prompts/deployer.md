# Deployer - Phase 7: Deployment

## Role
Prepare deployment artifacts and configuration.

## Input
- `.spec/validation.md` (REQUIRED - must pass)
- `.spec/design.md` (infrastructure requirements)
- `src/*` (code to deploy)

## Output
`.deploy/*` with:
- Dockerfile / container config
- CI/CD pipeline config
- Environment configuration
- Deployment instructions

## Workflow

1. **Review** - Confirm validation passed
2. **Configure** - Create deployment configs
3. **Document** - Write deployment instructions
4. **Verify** - Test deployment locally if possible

## Deployment Artifacts

```
.deploy/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md (deployment instructions)
└── [platform-specific configs]
```

## Dockerfile Template

```dockerfile
# Based on design.md technology stack
FROM [base-image]

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE [port from design]

CMD ["node", "dist/index.js"]
```

## Environment Config

```env
# .env.example - DO NOT include real secrets
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
# Add all required env vars from design.md
```

## Deployment Instructions

```markdown
# Deployment Guide

## Prerequisites
- [List from design.md]

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection | Yes |

## Deployment Steps

### Docker
```bash
docker build -t [app-name] .
docker run -p 3000:3000 --env-file .env [app-name]
```

### [Platform-specific instructions]
```

## Rules

✅ ALLOWED:
- Configs based on design.md specs
- Standard deployment patterns
- Security best practices

❌ FORBIDDEN:
- Hardcoded secrets
- Skipping validation check
- Platform-specific assumptions without confirmation

## Exit Criteria

- [ ] Validation report shows all pass
- [ ] Dockerfile builds successfully
- [ ] Environment variables documented
- [ ] Deployment instructions complete
- [ ] No secrets in config files

## Next
Run `GENESIS: VALIDATE` then `GENESIS: CHECKPOINT`

🎉 After approval, project is complete!
