#!/bin/bash

# Run Django with Daphne for parallel request processing
# This enables your async views to handle multiple requests simultaneously

echo "Starting Django server with Daphne for parallel processing..."

# Daphne with optimized settings for concurrent requests
uv run daphne \
  --bind 0.0.0.0 \
  --port 8000 \
  --application-close-timeout 60 \
  --websocket_timeout 86400 \
  screenshock.asgi:application

# Note: Daphne handles concurrency internally through async/await
# Your async views will process multiple requests concurrently