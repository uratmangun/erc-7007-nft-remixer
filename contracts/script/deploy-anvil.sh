#!/bin/bash

# Export the provided private key
export PRIVATE_KEY=0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

# Create contract-abi directory if it doesn't exist
mkdir -p contract-abi

# Build the contracts first to generate fresh ABIs
forge build

# Copy the ABIs
cp out/Verifier.sol/Groth16Verifier.json contract-abi/
cp out/AIGCNFT.sol/AIGCNFT.json contract-abi/

# Deploy the contracts and capture the output
OUTPUT=$(forge script contracts/script/Deploy.s.sol:DeployScript \
    --rpc-url http://localhost:8545 \
    --broadcast \
    -vvv)

# Extract contract addresses using grep and sed
VERIFIER_ADDRESS=$(echo "$OUTPUT" | grep "Verifier deployed to:" | sed 's/.*Verifier deployed to: \(0x[a-fA-F0-9]*\).*/\1/')
AIGCNFT_ADDRESS=$(echo "$OUTPUT" | grep "AIGCNFT deployed to:" | sed 's/.*AIGCNFT deployed to: \(0x[a-fA-F0-9]*\).*/\1/')

# Create addresses.json
cat > contract-abi/addresses.json << EOF
{
    "verifier": "$VERIFIER_ADDRESS",
    "aigcnft": "$AIGCNFT_ADDRESS"
}
EOF

echo "Contract addresses and ABIs have been saved to contract-abi/"
echo "Verifier address: $VERIFIER_ADDRESS"
echo "AIGCNFT address: $AIGCNFT_ADDRESS"
