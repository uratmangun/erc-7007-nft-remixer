pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template AIGCVerifier() {
    // Private inputs
    signal input prompt;       // Hashed prompt (private)
    signal input image;        // Hashed image (private)
    signal input author;       // Author address (private)
    signal input requestId;    // Request ID (private)

    // Public input: Hash of (prompt, image, author, requestId)
    signal output publicHash;

    // Hash the inputs using Poseidon
    component poseidon = Poseidon(4);
    poseidon.inputs[0] <== prompt;
    poseidon.inputs[1] <== image;
    poseidon.inputs[2] <== author;
    poseidon.inputs[3] <== requestId;

    // Output the public hash for on-chain verification
    publicHash <== poseidon.out;
}

component main = AIGCVerifier();