#!/bin/bash

# Stop and remove existing container if it exists
docker stop anvil 2>/dev/null
docker rm anvil 2>/dev/null

# Run Anvil with proper network settings
docker run -d \
  --name anvil \
  --restart always \
  --network host \
  ghcr.io/foundry-rs/foundry \
  anvil \
  --host 0.0.0.0 \
  --chain-id 31337 \
  --block-time 1 \
  --allow-origin "*"

echo "Anvil container started in detached mode with restart always"
echo "Waiting for Anvil to start..."
sleep 2

# Test the connection
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://localhost:8545

echo -e "\nAnvil is running and accessible at http://localhost:8545"
