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
echo ""

# Get container sizes for both architectures
echo "📏 Container Sizes:"
echo "────────────────────────────────────────────────────────────"

# Function to get human-readable size
get_size() {
    local size_bytes=$1
    if [ $size_bytes -ge 1073741824 ]; then
        # Calculate GB with one decimal place
        local gb=$(( size_bytes / 1073741824 ))
        local remainder=$(( size_bytes % 1073741824 ))
        local decimal=$(( remainder * 10 / 1073741824 ))
        echo "${gb}.${decimal}GB"
    elif [ $size_bytes -ge 1048576 ]; then
        # Calculate MB with one decimal place
        local mb=$(( size_bytes / 1048576 ))
        local remainder=$(( size_bytes % 1048576 ))
        local decimal=$(( remainder * 10 / 1048576 ))
        echo "${mb}.${decimal}MB"
    elif [ $size_bytes -ge 1024 ]; then
        # Calculate KB with one decimal place
        local kb=$(( size_bytes / 1024 ))
        local remainder=$(( size_bytes % 1024 ))
        local decimal=$(( remainder * 10 / 1024 ))
        echo "${kb}.${decimal}KB"
    else
        echo "${size_bytes}B"
    fi
}

# Get image manifest information
echo "🔍 Inspecting built images..."
MANIFEST_INFO=$(docker buildx imagetools inspect $DOCKER_IMAGE --format "{{json .}}" 2>/dev/null)

if [ -n "$MANIFEST_INFO" ]; then
    # Extract sizes for each platform
    AMD64_SIZE=$(echo "$MANIFEST_INFO" | grep -o '"platform":\s*"linux/amd64"[^}]*"size":\s*[0-9]*' | grep -o '"size":\s*[0-9]*' | grep -o '[0-9]*' | head -1)
    ARM64_SIZE=$(echo "$MANIFEST_INFO" | grep -o '"platform":\s*"linux/arm64"[^}]*"size":\s*[0-9]*' | grep -o '"size":\s*[0-9]*' | grep -o '[0-9]*' | head -1)

    if [ -n "$AMD64_SIZE" ]; then
        AMD64_SIZE_HUMAN=$(get_size $AMD64_SIZE)
        echo "AMD64 (x86_64):    $AMD64_SIZE_HUMAN"
    else
        echo "AMD64 (x86_64):    Size unavailable"
    fi

    if [ -n "$ARM64_SIZE" ]; then
        ARM64_SIZE_HUMAN=$(get_size $ARM64_SIZE)
        echo "ARM64 (aarch64):  $ARM64_SIZE_HUMAN"
    else
        echo "ARM64 (aarch64):  Size unavailable"
    fi

    # Calculate total size if both are available
    if [ -n "$AMD64_SIZE" ] && [ -n "$ARM64_SIZE" ]; then
        TOTAL_SIZE=$((AMD64_SIZE + ARM64_SIZE))
        TOTAL_SIZE_HUMAN=$(get_size $TOTAL_SIZE)
        echo "Total (both):      $TOTAL_SIZE_HUMAN"
    fi
else
    echo "Unable to retrieve image size information"
    echo "This may be normal for some registries or network conditions"
fi

# Try to show local images if available
if docker images $DOCKER_IMAGE 2>/dev/null | grep -q $DOCKER_IMAGE; then
    echo ""
    echo "📦 Local Images (if available):"
    docker images $DOCKER_IMAGE --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.Architecture}}" 2>/dev/null || echo "No local images found"
fi

# Get amd64 image size
AMD64_SIZE=$(docker buildx imagetools inspect $DOCKER_IMAGE --format "{{.Manifest.Digest}}" 2>/dev/null | head -1)
if [ -n "$AMD64_SIZE" ]; then
    # Try to get size from registry (this might not work for all registries)
    AMD64_SIZE_BYTES=$(docker manifest inspect $DOCKER_IMAGE | grep -A 10 '"platform": {"architecture": "amd64"' | grep '"size"' | head -1 | sed 's/.*"size": \([0-9]*\).*/\1/' 2>/dev/null || echo "0")
    if [ "$AMD64_SIZE_BYTES" != "0" ]; then
        AMD64_SIZE_HUMAN=$(get_size $AMD64_SIZE_BYTES)
        echo "AMD64 (x86_64):    $AMD64_SIZE_HUMAN"
    else
        echo "AMD64 (x86_64):    Size unavailable"
    fi
else
    echo "AMD64 (x86_64):    Size unavailable"
fi

# Get arm64 image size
ARM64_SIZE=$(docker buildx imagetools inspect $DOCKER_IMAGE --format "{{.Manifest.Digest}}" 2>/dev/null | head -1)
if [ -n "$ARM64_SIZE" ]; then
    # Try to get size from registry
    ARM64_SIZE_BYTES=$(docker manifest inspect $DOCKER_IMAGE | grep -A 10 '"platform": {"architecture": "arm64"' | grep '"size"' | head -1 | sed 's/.*"size": \([0-9]*\).*/\1/' 2>/dev/null || echo "0")
    if [ "$ARM64_SIZE_BYTES" != "0" ]; then
        ARM64_SIZE_HUMAN=$(get_size $ARM64_SIZE_BYTES)
        echo "ARM64 (aarch64):  $ARM64_SIZE_HUMAN"
    else
        echo "ARM64 (aarch64):  Size unavailable"
    fi
else
    echo "ARM64 (aarch64):  Size unavailable"
fi

# Try alternative method using docker images command if available locally
if docker images $DOCKER_IMAGE | grep -q $DOCKER_IMAGE; then
    echo ""
    echo "📦 Local Images:"
    docker images $DOCKER_IMAGE --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.Architecture}}"
fi

echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Successfully built and pushed $DOCKER_IMAGE for amd64 and arm64!"