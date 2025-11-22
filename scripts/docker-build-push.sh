#!/bin/bash
# Multi-stage Docker build optimized for speed
# - Uses BuildKit cache mounts for npm and Vite
# - Copies files in layers for better caching
# - Excludes unnecessary files via .dockerignore
# - Uses --no-cache to ensure fresh builds and prevent version discrepancies
set -e

DOCKER_IMAGE="joelmale/5e-character-forge:latest"
DOCKER_IMAGE_BUILDER="${DOCKER_IMAGE}-builder"

echo "🚀 Building and pushing optimized Docker images: $DOCKER_IMAGE"
echo "⏱️  Start time: $(date '+%Y-%m-%d %H:%M:%S')"
BUILD_START=$(date +%s)

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Create and use buildx builder if it doesn't exist
if ! docker buildx ls | grep -q "multi-arch-builder"; then
    echo "📦 Creating multi-arch builder..."
    docker buildx create --name multi-arch-builder --use
    docker buildx inspect --bootstrap
fi

echo ""
echo "🏗️  Building builder stage for cache..."
echo "⏱️  Builder stage start: $(date '+%H:%M:%S')"
BUILDER_START=$(date +%s)

# Ensure cache directory exists
mkdir -p /tmp/.buildx-cache

# Build builder stage first for better caching
docker buildx build \
    --no-cache \
    --progress=plain \
    --target builder \
    --platform linux/amd64,linux/arm64 \
    --cache-from type=local,src=/tmp/.buildx-cache \
    --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
    --tag "$DOCKER_IMAGE_BUILDER" \
    --push \
    .

BUILDER_END=$(date +%s)
BUILDER_DURATION=$((BUILDER_END - BUILDER_START))
echo "✅ Builder stage completed in ${BUILDER_DURATION}s"

echo ""
echo "🏗️  Building and pushing final production image..."
echo "⏱️  Production stage start: $(date '+%H:%M:%S')"
PRODUCTION_START=$(date +%s)

# Ensure cache directory exists
mkdir -p /tmp/.buildx-cache

# Build and push final production image with cache
docker buildx build \
    --no-cache \
    --progress=plain \
    --platform linux/amd64,linux/arm64 \
    --cache-from type=local,src=/tmp/.buildx-cache \
    --cache-from "$DOCKER_IMAGE_BUILDER" \
    --tag "$DOCKER_IMAGE" \
    --push \
    .

PRODUCTION_END=$(date +%s)
PRODUCTION_DURATION=$((PRODUCTION_END - PRODUCTION_START))
echo "✅ Production stage completed in ${PRODUCTION_DURATION}s"

# Clean up cache (optional - comment out if you want to keep cache)
echo ""
echo "🧹 Cleaning up build cache..."
rm -rf /tmp/.buildx-cache
mv /tmp/.buildx-cache-new /tmp/.buildx-cache 2>/dev/null || true

BUILD_END=$(date +%s)
TOTAL_DURATION=$((BUILD_END - BUILD_START))

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 Build Summary"
echo "════════════════════════════════════════════════════════════"
echo "Builder stage:     ${BUILDER_DURATION}s"
echo "Production stage:  ${PRODUCTION_DURATION}s"
echo "────────────────────────────────────────────────────────────"
echo "Total time:        ${TOTAL_DURATION}s"
echo "End time:          $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Successfully built and pushed $DOCKER_IMAGE for amd64 and arm64!"