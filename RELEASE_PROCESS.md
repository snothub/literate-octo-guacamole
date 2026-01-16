# Release Process

This project uses **semantic versioning** and **GitOps** for deployments. Here's how to create a release.

## Quick Start

```bash
# 1. Make your changes and commit
git add .
git commit -m "feat: add new feature"
git push

# 2. Create a version tag
git tag v1.0.1
git push origin v1.0.1

# 3. Done! GitHub Actions will:
#    - Build Docker images with version v1.0.1
#    - Push images to Docker Hub
#    - Update ArgoCD manifests in Git
#    - ArgoCD will auto-deploy the new version
```

## Semantic Versioning

Use semantic versioning for tags: `v{MAJOR}.{MINOR}.{PATCH}`

- **MAJOR** (v2.0.0): Breaking changes
- **MINOR** (v1.1.0): New features, backward compatible
- **PATCH** (v1.0.1): Bug fixes

Examples:
```bash
git tag v1.0.0    # First release
git tag v1.0.1    # Bug fix
git tag v1.1.0    # New feature
git tag v2.0.0    # Breaking change
```

## Release Workflow

### Development Workflow (Non-Releases)

When you push to `main` without a tag:
- GitHub Actions builds images tagged with commit SHA (e.g., `abc1234`)
- Also tags as `latest`
- **Does NOT update ArgoCD manifests**
- Good for testing builds without deploying

### Release Workflow (With Version Tag)

When you push a version tag (e.g., `v1.2.3`):

1. **GitHub Actions triggers:**
   - Builds frontend: `danijels/music-man:v1.2.3` and `:latest`
   - Builds backend: `danijels/music-man-api:v1.2.3` and `:latest`
   - Pushes to Docker Hub

2. **Git repository updated:**
   - Updates `kubernetes/argocd/application.yaml` with `tag: v1.2.3`
   - Updates `kubernetes/argocd/application-prod.yaml` with `tag: v1.2.3`
   - Commits and pushes to main branch

3. **ArgoCD auto-syncs:**
   - Detects Git change
   - Pulls new images from Docker Hub
   - Deploys to both dev and prod namespaces

## Step-by-Step Example

### Scenario: Deploy a bug fix

```bash
# 1. Start from main branch
git checkout main
git pull

# 2. Create a branch (optional but recommended)
git checkout -b fix/loop-controls

# 3. Make your changes
# ... edit files ...
git add .
git commit -m "fix: resolve loop control timing issue"

# 4. Push to GitHub
git push origin fix/loop-controls

# 5. Create PR and merge to main (or push directly to main)
git checkout main
git merge fix/loop-controls
git push

# 6. Create and push version tag
git tag v1.0.1
git push origin v1.0.1

# 7. Watch GitHub Actions
# Go to: https://github.com/snothub/literate-octo-guacamole/actions
# You'll see the workflow building and deploying

# 8. Verify ArgoCD
# After ~2 minutes, check ArgoCD UI or run:
argocd app get music-man
# Should show: Image: danijels/music-man:v1.0.1
```

## Checking Deployment Status

### Via ArgoCD CLI
```bash
# Check application status
argocd app get music-man

# Check if images are up to date
kubectl get pods -n music-man -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n'
```

### Via ArgoCD UI
1. Open ArgoCD UI
2. Click on `music-man` application
3. Check pod images in the resource tree
4. Verify sync status is "Synced"

### Via kubectl
```bash
# Check running images
kubectl get pods -n music-man -o wide

# Describe a pod to see image
kubectl describe pod frontend-xxx -n music-man | grep Image:
```

## Rollback

If a release has issues, rollback to a previous version:

### Option 1: Create a new tag with old version
```bash
# NOT RECOMMENDED - creates confusion with versions
```

### Option 2: Manual Git revert (Recommended)
```bash
# Find the commit that updated to bad version
git log kubernetes/argocd/application.yaml

# Revert the version update commit
git revert <commit-hash>
git push

# ArgoCD will auto-sync to previous version
```

### Option 3: Manual ArgoCD sync to specific version
```bash
# Update application.yaml locally
sed -i 's|tag: v1.0.1|tag: v1.0.0|g' kubernetes/argocd/application.yaml

# Commit and push
git add kubernetes/argocd/application.yaml
git commit -m "chore: rollback to v1.0.0"
git push

# ArgoCD will sync automatically
```

### Option 4: Emergency kubectl rollback
```bash
# Quick rollback without waiting for GitOps
kubectl set image deployment/frontend frontend=danijels/music-man:v1.0.0 -n music-man
kubectl set image deployment/backend backend=danijels/music-man-api:v1.0.0 -n music-man

# Then update Git to match
sed -i 's|tag: v1.0.1|tag: v1.0.0|g' kubernetes/argocd/application.yaml
git add kubernetes/argocd/application.yaml
git commit -m "chore: rollback to v1.0.0"
git push
```

## Viewing Release History

### GitHub Releases
View all releases at: https://github.com/snothub/literate-octo-guacamole/releases

### Git Tags
```bash
# List all tags
git tag -l

# Show tag details
git show v1.0.1

# View commit history
git log --oneline --decorate
```

### Docker Hub Images
View at:
- https://hub.docker.com/r/danijels/music-man/tags
- https://hub.docker.com/r/danijels/music-man-api/tags

### Git History
```bash
# See version changes in ArgoCD manifests
git log --oneline kubernetes/argocd/application.yaml

# See all changes in a specific release
git log v1.0.0..v1.0.1 --oneline
```

## Production vs Development

Both `application.yaml` (dev) and `application-prod.yaml` (prod) are updated with the same version tag. This means:

- **Same version deployed to both environments**
- Use different branches if you want separate versions (advanced)

If you want to test in dev before promoting to prod:

### Option A: Separate branches (Advanced)
```bash
# Use main branch for dev
# Use production branch for prod

# Update prod ArgoCD app to track production branch
```

### Option B: Manual prod updates
```bash
# After releasing, manually update prod to specific version
# Only update application-prod.yaml, not application.yaml
```

For most use cases, deploying the same version to both dev and prod is fine, as dev is typically used for early testing.

## Troubleshooting

### Issue: GitHub Actions permission denied (403)

**Error:** `Permission to snothub/literate-octo-guacamole.git denied to github-actions[bot]`

**Cause:** GitHub Actions doesn't have permission to push to the repository.

**Fix:** This has been resolved in the workflow by adding:
```yaml
permissions:
  contents: write
```

If you still see this error, check:
1. Repository Settings → Actions → General
2. Under "Workflow permissions"
3. Select "Read and write permissions"
4. Click "Save"

### Issue: GitHub Actions not triggering

**Check:**
- Tag format must be `v*.*.*` (e.g., `v1.0.0`)
- Tag was pushed: `git push origin v1.0.1`
- Check Actions tab: https://github.com/snothub/literate-octo-guacamole/actions

### Issue: ArgoCD not updating

**Check:**
```bash
# Verify Git was updated
git log -1 kubernetes/argocd/application.yaml

# Check ArgoCD sync status
argocd app get music-man

# Force refresh
argocd app get music-man --refresh

# Check ArgoCD application config
kubectl get application music-man -n argocd -o yaml
```

### Issue: Pods not updating to new image

**Check:**
```bash
# Verify image was pushed to Docker Hub
docker pull danijels/music-man:v1.0.1

# Check pod events
kubectl describe pod <pod-name> -n music-man

# Check if ArgoCD synced
argocd app get music-man

# Force pod recreation
kubectl delete pod <pod-name> -n music-man
```

### Issue: Git push fails in GitHub Actions

**Error:** `! [remote rejected] HEAD -> main (protected branch hook declined)`

**Fix:**
1. Go to repository Settings → Branches
2. Edit branch protection rules for `main`
3. Enable "Allow specified actors to bypass required pull requests"
4. Add `github-actions[bot]` to the list

OR

5. Disable branch protection for GitHub Actions bot

## Best Practices

1. **Always test locally first** before creating a release tag
2. **Use descriptive commit messages** following conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `chore:` for maintenance

3. **Tag after merging to main** - ensure all tests pass first

4. **Use patch versions** for hotfixes (v1.0.1, v1.0.2)

5. **Document breaking changes** in commit messages when bumping major version

6. **Keep a CHANGELOG.md** (optional but recommended) to track notable changes

## Creating Your First Release

If this is your first time releasing:

```bash
# Current state: application.yaml has tag: v1.0.0 as placeholder

# Build and push the first real release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will build v1.0.0 images
# Git will be updated with actual v1.0.0 tag
# ArgoCD will deploy v1.0.0

# For the next release
git tag v1.0.1
git push origin v1.0.1
```

## Summary

**To release a new version:**
```bash
git tag v1.x.x && git push origin v1.x.x
```

That's it! GitHub Actions and ArgoCD handle the rest.
