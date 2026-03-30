#!/bin/sh
# Build the application container with the current git revision baked in.
# Usage: ./build.sh [docker compose build options]
set -e

export GIT_REVISION=$(git log --pretty=format:"%h (%ai)" -n 1)
echo "Building with GIT_REVISION: $GIT_REVISION"
docker compose build "$@" web
