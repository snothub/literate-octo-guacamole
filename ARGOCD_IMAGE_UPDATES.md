# ArgoCD Image Update Strategies

This document explains different approaches to trigger ArgoCD to deploy new Docker images.

## Current Implementation

**This project uses Option 3: Versioned Tags with Git Updates** - see [RELEASE_PROCESS.md](RELEASE_PROCESS.md) for usage instructions.

Simply run:
```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will build the images, update Git, and ArgoCD will auto-deploy.

---

## The Challenge

ArgoCD watches your Git repository for changes, but it doesn't automatically know when new Docker images are pushed to Docker Hub. When using the `latest` tag, ArgoCD sees no change in Git (the tag is still "latest"), so it doesn't redeploy even though the image content changed.

## Solutions

### Option 1: Webhook Trigger from GitHub Actions (Recommended for `latest` tags)

**How it works:** After pushing images to Docker Hub, GitHub Actions calls ArgoCD's API to trigger a sync.

**Setup:**

1. **Get ArgoCD Server URL:**
   ```bash
   # If using port-forward
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   # Server: localhost:8080

   # If using ingress
   # Server: argocd.yourdomain.com
   ```

2. **Generate ArgoCD Token:**
   ```bash
   # Login to ArgoCD
   argocd login <ARGOCD_SERVER>

   # Create a token for CI/CD
   argocd account generate-token --account ci-bot

   # Or use admin token (less secure)
   argocd account generate-token
   ```

3. **Add GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add secret: `ARGOCD_TOKEN` = (token from step 2)
   - Add variable: `ARGOCD_SERVER` = your ArgoCD server address (without https://)
     - Example: `argocd.yourdomain.com`
     - Or: `localhost:8080` (if using ngrok/public tunnel)

4. **GitHub Actions Workflow:**
   The workflow (`.github/workflows/docker-image.yml`) has been updated to trigger ArgoCD sync after pushing images.

**Pros:**
- Simple setup
- Works with `latest` tags
- Immediate deployment after image push
- No changes needed in Kubernetes

**Cons:**
- Requires ArgoCD to be accessible from GitHub Actions
- Using `latest` tag is not a best practice for production

---

### Option 2: ArgoCD Image Updater (Automated tag updates)

**How it works:** ArgoCD Image Updater watches Docker Hub for new image tags and updates your Git repository automatically.

**Setup:**

1. **Install ArgoCD Image Updater:**
   ```bash
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
   ```

2. **Configure the Application:**

   Edit `kubernetes/argocd/application.yaml`:
   ```yaml
   metadata:
     annotations:
       argocd-image-updater.argoproj.io/image-list: frontend=danijels/music-man,backend=danijels/music-man-api
       argocd-image-updater.argoproj.io/frontend.update-strategy: latest
       argocd-image-updater.argoproj.io/backend.update-strategy: latest
       argocd-image-updater.argoproj.io/frontend.force-update: "true"
       argocd-image-updater.argoproj.io/backend.force-update: "true"
       argocd-image-updater.argoproj.io/write-back-method: git
   ```

3. **Configure Git Write-back (required for Image Updater):**
   ```bash
   # Create a GitHub personal access token with repo permissions
   # Then create a secret in ArgoCD namespace:
   kubectl create secret generic git-creds \
     --from-literal=username=<your-github-username> \
     --from-literal=password=<your-github-token> \
     -n argocd
   ```

**Pros:**
- Fully automated
- Can work with versioned tags (semver)
- No GitHub Actions changes needed
- Proper GitOps workflow

**Cons:**
- More complex setup
- Requires Git write-back configuration
- Polling interval (default 2 minutes)
- Needs ArgoCD Image Updater installation

---

### Option 3: Update Git with Versioned Tags (Best Practice) ✅ IMPLEMENTED

**How it works:** Use semantic versioning for images and update the Git repository with new versions.

**Status:** This is the current implementation. See [RELEASE_PROCESS.md](RELEASE_PROCESS.md) for usage.

**Setup:**

1. **Update GitHub Actions to use versioned tags:**

   Edit `.github/workflows/docker-image.yml`:
   ```yaml
   - name: Set version from git tag
     run: |
       if [[ $GITHUB_REF == refs/tags/* ]]; then
         echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV
       else
         echo "VERSION=${GITHUB_SHA::7}" >> $GITHUB_ENV
       fi

   - name: Build frontend Docker image
     run: |
       docker build . --file Dockerfile \
         --tag ${{ secrets.DOCKERHUB_USERNAME }}/music-man:${{ env.VERSION }} \
         --tag ${{ secrets.DOCKERHUB_USERNAME }}/music-man:latest
   ```

2. **Update Git repository with new version:**
   ```yaml
   - name: Update ArgoCD application with new version
     run: |
       git config user.name "github-actions[bot]"
       git config user.email "github-actions[bot]@users.noreply.github.com"

       # Update image tag in ArgoCD application
       sed -i "s|tag: .*|tag: \"${{ env.VERSION }}\"|g" kubernetes/argocd/application.yaml

       git add kubernetes/argocd/application.yaml
       git commit -m "chore: update image version to ${{ env.VERSION }}"
       git push
   ```

3. **Deployment workflow:**
   ```bash
   # Tag a release
   git tag v1.2.3
   git push origin v1.2.3

   # GitHub Actions will:
   # 1. Build images with tag v1.2.3
   # 2. Push to Docker Hub
   # 3. Update Git repo with new version
   # 4. ArgoCD detects Git change and deploys
   ```

**Pros:**
- Industry best practice
- Full audit trail (Git history)
- Easy rollbacks (revert Git commit)
- Reproducible deployments
- No external access needed

**Cons:**
- Requires workflow changes
- Need to create Git tags for releases
- More complex CI/CD pipeline

---

### Option 4: Manual Sync

**Simple approach:** Manually trigger sync after pushing images.

```bash
# Via CLI
argocd app sync music-man

# With hard refresh (redownload images)
argocd app sync music-man --force

# Via API
curl -X POST \
  https://<argocd-server>/api/v1/applications/music-man/sync \
  -H "Authorization: Bearer $ARGOCD_TOKEN"

# Via UI
# Open ArgoCD UI → Select application → Click "Sync"
```

**Pros:**
- No setup required
- Full control over deployments

**Cons:**
- Manual process
- Not suitable for automation

---

### Option 5: ImagePullPolicy Always + Deployment Restart

**How it works:** Configure Kubernetes to always pull the latest image and trigger a rollout restart.

1. **Update deployment to always pull:**

   Already configured in `helm-chart/values.yaml`:
   ```yaml
   imagePullPolicy: Always  # Change from IfNotPresent
   ```

2. **Trigger rollout from GitHub Actions:**
   ```yaml
   - name: Rollout restart deployments
     run: |
       kubectl rollout restart deployment/frontend -n music-man
       kubectl rollout restart deployment/backend -n music-man
   ```

**Pros:**
- Simple concept
- Works with `latest` tags

**Cons:**
- Bypasses ArgoCD (not true GitOps)
- Requires kubectl access from CI/CD
- ArgoCD will show "Out of Sync"
- Not recommended for GitOps workflows

---

## Recommendations

**For Development/Testing:**
- Use **Option 1** (Webhook Trigger) - Quick and easy with `latest` tags

**For Production:**
- Use **Option 3** (Versioned Tags) - Industry best practice
- Benefits:
  - Clear version history
  - Easy rollbacks
  - Reproducible builds
  - True GitOps workflow

**Alternative for Production:**
- Use **Option 2** (ArgoCD Image Updater) if you want fully automated deployments
- Good for:
  - Staging environments
  - Automated testing pipelines
  - Continuous deployment workflows

---

## Previous Implementation Note

Earlier versions used **Option 1** (Webhook Trigger), but the project has now been upgraded to **Option 3** (Versioned Tags with Git Updates) for better GitOps practices and version management.

---

## Forcing Image Pull with `latest` Tag

When using `latest` tags, even after ArgoCD syncs, Kubernetes might use cached images. To force image pull:

**Option A: Set imagePullPolicy**
```yaml
# In values.yaml
imagePullPolicy: Always
```

**Option B: Update deployment annotation in ArgoCD application**
```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-options: Replace=true
```

**Option C: Hard refresh in ArgoCD**
```bash
argocd app sync music-man --force
```

The Helm chart already uses `imagePullPolicy: IfNotPresent`, which is suitable for versioned tags. For `latest` tags in development, consider changing to `Always`.

---

## Troubleshooting

**ArgoCD sync triggered but pods not updating:**
- Check `imagePullPolicy` - set to `Always` for `latest` tags
- Verify images were actually pushed to Docker Hub
- Check pod events: `kubectl describe pod <pod-name> -n music-man`
- Force restart: `argocd app sync music-man --force`

**GitHub Actions can't reach ArgoCD:**
- Ensure ArgoCD server is publicly accessible or use ngrok/tunnel
- Check `ARGOCD_SERVER` variable doesn't include `https://`
- Verify `ARGOCD_TOKEN` is valid

**ArgoCD Image Updater not working:**
- Check Image Updater logs: `kubectl logs -n argocd -l app.kubernetes.io/name=argocd-image-updater`
- Verify annotations are correct
- Ensure Git write-back is configured
- Check Docker Hub is accessible from cluster
