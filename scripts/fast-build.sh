#!/bin/bash

# Fast Docker Build Script with BuildKit optimizations

set -e

echo "🚀 Starting optimized Docker build..."
echo "⏱️  Start time: $(date '+%Y-%m-%d %H:%M:%S')"
BUILD_START=$(date +%s)

# Enable BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo ""
echo "🏗️  Building builder stage..."
echo "⏱️  Builder stage start: $(date '+%H:%M:%S')"
BUILDER_START=$(date +%s)

# Build with cache mounts and optimizations
docker build \
  --progress=plain \
  --target builder \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from joelmale/5e-character-forge:latest \
  --tag joelmale/5e-character-forge:builder \
  .

BUILDER_END=$(date +%s)
BUILDER_DURATION=$((BUILDER_END - BUILDER_START))
echo "✅ Builder stage completed in ${BUILDER_DURATION}s"

echo ""
echo "🏗️  Building final production image..."
echo "⏱️  Production stage start: $(date '+%H:%M:%S')"
PRODUCTION_START=$(date +%s)

# Build final production image
docker build \
  --progress=plain \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from joelmale/5e-character-forge:latest \
  --cache-from joelmale/5e-character-forge:builder \
  --tag joelmale/5e-character-forge:latest \
  .

PRODUCTION_END=$(date +%s)
PRODUCTION_DURATION=$((PRODUCTION_END - PRODUCTION_START))
echo "✅ Production stage completed in ${PRODUCTION_DURATION}s"

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
echo "🎉 Docker build completed successfully!"