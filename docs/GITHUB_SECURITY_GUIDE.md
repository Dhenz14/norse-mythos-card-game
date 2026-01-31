# GitHub Security Guide

> Mandatory security practices for pushing code to GitHub from Replit.

---

## Critical: Files to NEVER Push to GitHub

### Replit Internal Files

These files contain Replit-specific configuration, internal URLs, and system data:

| File | Reason |
|------|--------|
| `.replit` | Replit workspace configuration |
| `replit.nix` | Nix environment configuration |
| `.replit-rules.json` | Replit agent rules |
| `replit.md` | Project memory/preferences |
| `replit_push_status.json` | Push status tracking |
| `log_mapping.json` | Internal log references |
| `nohup.out` | Process output logs |

### Database & Secrets

| Pattern | Reason |
|---------|--------|
| `*.db`, `*.sqlite` | Database files with data |
| `*.pem`, `*.key` | Private keys |
| `.env`, `.env.*` | Environment secrets |
| `*_credentials.json` | API credentials |
| `DATABASE_URL` references | Connection strings |

### Test & Utility Scripts

| Pattern | Reason |
|---------|--------|
| `*.cjs` (in root) | One-off fix/test scripts |
| `*.test.js`, `*.spec.ts` | Test files |
| `ast-analysis-results.json` | Analysis output |
| `all_files.txt` | Debug listings |

### Attached Assets with Internal Info

Some pasted content contains internal Replit information:
- Files matching `attached_assets/Pasted--Coframe-*`
- Any file mentioning internal Replit URLs

---

## How to Verify Before Pushing

### Step 1: Check .gitignore Coverage

Ensure `.gitignore` includes all patterns above. See the current file for the complete list.

### Step 2: Check What Will Be Pushed

```bash
# See files that will be included
git status

# See what's ignored
git status --ignored
```

### Step 3: Search for Sensitive Patterns

```bash
# Check for database URLs
grep -r "DATABASE_URL\|postgresql://" --include="*.ts" --include="*.js"

# Check for API keys
grep -r "API_KEY\|SECRET_KEY" --include="*.ts" --include="*.js"

# Check for Replit internal URLs
grep -r "repl\.co\|replit\.dev" --include="*.ts" --include="*.js"
```

---

## Files Already in Git History

If sensitive files were already pushed, they exist in git history. To fully remove them:

1. **Contact repository owner** - They must use `git filter-branch` or BFG Repo Cleaner
2. **Rotate any exposed secrets** - Assume compromised if pushed
3. **Force push cleaned history** - Requires repository admin access

---

## Push Script Security Check

The `scripts/pushToGitHub.ts` should validate files before pushing. Add this check:

```typescript
// Files that should NEVER be pushed
const FORBIDDEN_FILES = [
  '.replit',
  'replit.nix',
  '.replit-rules.json',
  'replit.md',
  '.env',
];

// Patterns that indicate sensitive content
const FORBIDDEN_PATTERNS = [
  /DATABASE_URL/,
  /API_KEY/,
  /SECRET_KEY/,
  /postgresql:\/\//,
  /\.replit\.dev/,
];
```

---

## Summary Checklist

Before every push to GitHub:

- [ ] `.gitignore` is up to date with all patterns
- [ ] No `.replit`, `replit.nix`, or `replit.md` staged
- [ ] No `.env` files or database files staged
- [ ] No `*.cjs` test scripts in root directory staged
- [ ] No files containing DATABASE_URL or API keys
- [ ] Ran `git status` to verify staged files
- [ ] Rotated any accidentally exposed secrets

---

## Quick Reference: What's Safe to Push

**Safe:**
- `client/src/` - Frontend source code
- `server/` - Backend source code (without secrets)
- `docs/` - Documentation
- `package.json`, `tsconfig.json` - Config (without secrets)
- `README.md`, `LICENSE` - Project info

**NOT Safe:**
- Anything in `.gitignore`
- Files with hardcoded secrets
- Database files or exports
- Replit-specific configuration
