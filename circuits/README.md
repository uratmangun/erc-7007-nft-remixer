# AIGC Data Verifier Circuit

This directory contains a Circom circuit for verifying AI-generated content data (AIGCData) as defined in ERC-7007. The circuit creates a zero-knowledge proof for the following data structure:

```solidity
struct AIGCData {
    bytes image;
    address author;
    uint256 requestId;
}
```

## Setup and Usage

1. Install dependencies:
```bash
bun install
```

2. Compile the circuit:
```bash
bun run compile
```

3. Generate the trusted setup:
```bash
bun run setup
```

4. Generate and verify a proof:
```bash
bun run generate-proof
```

## Circuit Details

The circuit (`aigc_verifier.circom`) performs the following:
1. Takes the image bytes, author address, and requestId as private inputs
2. Hashes the image bytes using Poseidon
3. Combines all elements into a final hash
4. Outputs the final hash that can be verified on-chain

## Integration with ERC-7007

This circuit can be used to create zero-knowledge proofs that verify the authenticity and ownership of AI-generated content while maintaining privacy of the actual content data.

