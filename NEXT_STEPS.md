# Next Steps for Deployment

Your 5e Character Forge is now ready for Docker Swarm deployment! Here's what you need to do next:

## ✅ Completed

- ✅ Vite build system configured
- ✅ Multi-stage Dockerfile created
- ✅ Nginx configuration for SPA routing
- ✅ Docker Swarm stack file (docker-compose.yml)
- ✅ GitHub Actions CI/CD pipeline
- ✅ Comprehensive deployment documentation
- ✅ All changes committed and pushed to GitHub

## 🚀 Deployment Steps

### 1. Configure GitHub Secrets (Required)

Go to: https://github.com/joelmale/5e_character_forge/settings/secrets/actions

Add these secrets:
- `DOCKER_USERNAME`: Your Docker Hub username (e.g., joelmale)
- `DOCKER_PASSWORD`: Docker Hub access token (get from https://hub.docker.com/settings/security)
- `SWARM_WEBHOOK_URL`: (Optional) Webhook endpoint for auto-updates
- `SWARM_WEBHOOK_TOKEN`: (Optional) Auth token for webhook

### 2. Test Local Build (Optional but Recommended)

Before deploying to swarm, test locally:

```bash
# Install dependencies
npm install

# Test development build
npm run dev
# Open http://localhost:3000

# Test production build
npm run build

# Test Docker build
docker build -t 5e-character-forge:test .
docker run -p 8080:80 5e-character-forge:test
# Open http://localhost:8080
```

### 3. Ensure Swarm Network Exists

On your swarm manager node:

```bash
# Check if npm_network exists
docker network ls | grep npm_network

# Create if it doesn't exist
docker network create -d overlay npm_network
```

### 4. Deploy to Docker Swarm

On your swarm manager node:

```bash
# Pull the repository (or copy docker-compose.yml)
git clone https://github.com/joelmale/5e_character_forge.git
cd 5e_character_forge

# Deploy the stack
docker stack deploy -c docker-compose.yml character-forge

# Check status
docker service ls | grep 5e-character-forge
docker service logs -f character-forge_5e-character-forge
```

### 5. Configure Nginx Proxy Manager

1. Open your NPM web interface
2. Go to **Proxy Hosts** → **Add Proxy Host**
3. **Details tab:**
   - Domain Names: `character.nexusvtt.com`
   - Scheme: `http`
   - Forward Hostname/IP: `character-forge_5e-character-forge`
   - Forward Port: `80`
   - Cache Assets: ✅
   - Block Common Exploits: ✅
   - Websockets Support: ✅
4. **SSL tab:**
   - SSL Certificate: Request Let's Encrypt or use existing
   - Force SSL: ✅
   - HTTP/2 Support: ✅
   - HSTS Enabled: ✅
5. Click **Save**

### 6. Test Your Deployment

```bash
# From any machine, test the endpoint
curl -I https://character.nexusvtt.com

# Should return 200 OK
```

Open in browser: https://character.nexusvtt.com

### 7. Setup Auto-Deployment (Optional)

#### Option A: Using Watchtower (Simpler)

```bash
docker service create \
  --name watchtower \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  --cleanup
```

Then remove the webhook step from GitHub Actions workflow.

#### Option B: Using Webhook Listener

See [DEPLOYMENT.md](./DEPLOYMENT.md) section "Setup Webhook Listener" for detailed instructions.

## 📊 Monitoring

```bash
# View service status
docker service ps character-forge_5e-character-forge

# View logs
docker service logs -f character-forge_5e-character-forge

# Check resource usage
docker stats
```

## 🔄 Making Updates

After setting up GitHub secrets and CI/CD:

```bash
# Make code changes locally
# Commit and push
git add .
git commit -m "Your changes"
git push origin master

# GitHub Actions will automatically:
# 1. Build new Docker image
# 2. Push to Docker Hub
# 3. Trigger swarm update (if webhook configured)
```

## 📝 Important Notes

1. **First deployment**: GitHub Actions will fail until you add Docker Hub credentials
2. **Webhook optional**: You can manually update with `docker service update --image joelmale/5e-character-forge:latest character-forge_5e-character-forge`
3. **Network name**: Ensure docker-compose.yml uses the correct network name for your NPM setup
4. **Port conflicts**: Service runs on port 80 internally, NPM routes externally
5. **Health checks**: Service has built-in health checks on `/health` endpoint

## 🆘 Troubleshooting

### Service not starting?
```bash
docker service ps character-forge_5e-character-forge --no-trunc
```

### Can't reach from NPM?
```bash
docker network inspect npm_network
docker service inspect character-forge_5e-character-forge
```

### GitHub Actions failing?
- Check you added Docker Hub credentials to GitHub Secrets
- Verify Docker Hub username matches image name in deploy.yml

## 📚 Documentation

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Project README: [README.md](./README.md)
- Design docs: [D&D_5e_Character_App_Design.md](./D&D_5e_Character_App_Design.md)

## 🎉 Success Checklist

- [ ] GitHub Secrets configured
- [ ] Local build tested
- [ ] npm_network exists on swarm
- [ ] Stack deployed successfully
- [ ] NPM proxy host configured
- [ ] SSL certificate active
- [ ] Site accessible at https://character.nexusvtt.com
- [ ] GitHub Actions running successfully
- [ ] Auto-deployment working (if configured)

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) or open an issue on GitHub!
