# Deployment Guide for Docker Swarm

This guide walks you through deploying the 5e Character Forge to your Docker Swarm homelab with automatic CI/CD.

## Prerequisites

- Docker Swarm initialized and running
- NPM (Nginx Proxy Manager) running on overlay network
- Domain name: `character.nexusvtt.com` configured
- Docker Hub account (or GitHub Container Registry)
- GitHub repository with Actions enabled

## Architecture Overview

```
GitHub Push → GitHub Actions → Build Image → Docker Hub
                                                 ↓
                                         Webhook Trigger
                                                 ↓
                                    Docker Swarm Update
                                                 ↓
                                         NPM Routing
                                                 ↓
                                    character.nexusvtt.com
```

## Setup Steps

### 1. Configure Docker Swarm Network

Ensure your NPM network exists and is accessible:

```bash
# Check if npm_network exists
docker network ls | grep npm_network

# If it doesn't exist, create it
docker network create -d overlay npm_network
```

### 2. Configure GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `joelmale` |
| `DOCKER_PASSWORD` | Docker Hub password or token | `dckr_pat_...` |
| `SWARM_WEBHOOK_URL` | Webhook endpoint for swarm updates | `https://your-webhook-server.com/hooks/deploy` |
| `SWARM_WEBHOOK_TOKEN` | Authentication token for webhook | `your-secure-token` |

### 3. Build and Push Initial Image

Option A: **Using GitHub Actions** (Recommended)
```bash
# Push to trigger automatic build
git push origin master
```

Option B: **Manual Build**
```bash
# Build the image
docker build -t joelmale/5e-character-forge:latest .

# Push to Docker Hub
docker push joelmale/5e-character-forge:latest
```

### 4. Deploy to Docker Swarm

```bash
# Deploy the stack
docker stack deploy -c docker-compose.yml character-forge

# Check service status
docker service ls | grep 5e-character-forge

# View service logs
docker service logs -f character-forge_5e-character-forge
```

### 5. Configure Nginx Proxy Manager

1. Log in to your NPM instance
2. Go to **Proxy Hosts** → **Add Proxy Host**
3. Configure:
   - **Domain Names**: `character.nexusvtt.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `character-forge_5e-character-forge` (service name)
   - **Forward Port**: `80`
   - **Cache Assets**: ✅ Enabled
   - **Block Common Exploits**: ✅ Enabled
   - **Websockets Support**: ✅ Enabled
4. Go to **SSL** tab:
   - **SSL Certificate**: Select or request Let's Encrypt
   - **Force SSL**: ✅ Enabled
   - **HTTP/2 Support**: ✅ Enabled
   - **HSTS Enabled**: ✅ Enabled

### 6. Setup Webhook Listener (Optional but Recommended)

For automatic deployments on push, set up a webhook listener on your swarm manager.

#### Option A: Using `webhook` Package

```bash
# On your swarm manager node
docker service create \
  --name webhook-listener \
  --network npm_network \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --publish 9000:9000 \
  almir/webhook \
  -verbose -hooks=/etc/webhook/hooks.json
```

Create `/etc/webhook/hooks.json`:
```json
[
  {
    "id": "deploy-character-forge",
    "execute-command": "/usr/local/bin/deploy-character-forge.sh",
    "command-working-directory": "/tmp",
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "image"
      }
    ],
    "trigger-rule": {
      "match": {
        "type": "value",
        "value": "5e-character-forge",
        "parameter": {
          "source": "payload",
          "name": "service"
        }
      }
    }
  }
]
```

Create `/usr/local/bin/deploy-character-forge.sh`:
```bash
#!/bin/bash
docker service update --image "$1" character-forge_5e-character-forge
```

Make it executable:
```bash
chmod +x /usr/local/bin/deploy-character-forge.sh
```

#### Option B: Using Watchtower (Simpler, Polls Docker Hub)

```bash
docker service create \
  --name watchtower \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  --cleanup \
  --include-stopped
```

Note: With Watchtower, you can remove the webhook step from GitHub Actions.

## Updating the Application

### Automatic Updates (if webhook configured)
Simply push to master:
```bash
git push origin master
```

GitHub Actions will:
1. Build the Docker image
2. Push to Docker Hub
3. Trigger webhook
4. Swarm updates service with zero downtime

### Manual Updates
```bash
# Pull latest image
docker service update --image joelmale/5e-character-forge:latest character-forge_5e-character-forge

# Or update the entire stack
docker stack deploy -c docker-compose.yml character-forge
```

## Monitoring and Troubleshooting

### Check Service Health
```bash
# View service status
docker service ps character-forge_5e-character-forge

# View logs
docker service logs -f character-forge_5e-character-forge

# Check service details
docker service inspect character-forge_5e-character-forge
```

### Common Issues

**Issue: Service not starting**
```bash
# Check service tasks
docker service ps character-forge_5e-character-forge --no-trunc

# Check node resources
docker node ls
docker node inspect <node-id>
```

**Issue: NPM can't reach service**
```bash
# Verify network connection
docker network inspect npm_network

# Ensure service is on the network
docker service inspect character-forge_5e-character-forge | grep npm_network
```

**Issue: Build failing in GitHub Actions**
```bash
# Check GitHub Actions logs
# Go to Actions tab → Latest workflow run

# Test build locally
docker build -t test-build .
```

## Scaling

Scale the service up or down:
```bash
# Scale to 4 replicas
docker service scale character-forge_5e-character-forge=4

# Scale down to 1 replica
docker service scale character-forge_5e-character-forge=1
```

## Rollback

If an update causes issues:
```bash
# Rollback to previous version
docker service rollback character-forge_5e-character-forge
```

## Removing the Application

```bash
# Remove the stack
docker stack rm character-forge

# Remove the Docker image
docker rmi joelmale/5e-character-forge:latest
```

## Performance Tuning

### Adjust Resource Limits

Edit `docker-compose.yml`:
```yaml
resources:
  limits:
    cpus: '1.0'    # Increase CPU
    memory: 512M   # Increase memory
  reservations:
    cpus: '0.5'
    memory: 256M
```

### Enable HTTP/2 in NPM

Already configured in the NPM setup steps above.

### Add CDN (Optional)

For better global performance, consider adding Cloudflare:
1. Add `character.nexusvtt.com` to Cloudflare
2. Enable proxy (orange cloud)
3. Configure caching rules for static assets

## Security Considerations

1. **Keep secrets secure**: Never commit Docker Hub credentials
2. **Use webhook authentication**: Protect webhook endpoint with Bearer token
3. **NPM SSL**: Always use SSL/TLS with Let's Encrypt
4. **Regular updates**: Keep base images updated
5. **Network isolation**: Service runs on private overlay network

## Backup and Recovery

The application stores all data client-side in IndexedDB. No server-side backup needed!

Users can export/import their data as JSON files through the UI.

## Support

For issues with deployment, check:
- GitHub Actions logs
- Docker service logs
- NPM logs
- Webhook listener logs (if configured)

---

**Happy Deploying!** 🚀
