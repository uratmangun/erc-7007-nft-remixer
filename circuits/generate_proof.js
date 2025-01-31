import snarkjs from "snarkjs";
import { readFileSync } from "fs";
import { ethers } from "ethers";

async function generateProof(prompt, image, author, requestId) {
    // Convert inputs to appropriate byte arrays
    const promptBytes = ethers.utils.arrayify(ethers.utils.formatBytes32String(prompt));
    const imageBytes = ethers.utils.arrayify(image).slice(0, 32); // Take first 32 bytes
    const authorBytes = ethers.utils.arrayify(author); // Should be 20 bytes
    const requestIdBytes = ethers.utils.arrayify(ethers.utils.formatBytes32String(requestId));

    const input = {
        prompt: Array.from(promptBytes),
        image: Array.from(imageBytes),
        author: Array.from(authorBytes),
        requestId: Array.from(requestIdBytes),
        pubInput: [ethers.utils.keccak256(
            ethers.utils.solidityPack(
                ['bytes', 'bytes'],
                [prompt, ethers.utils.defaultAbiCoder.encode(
                    ['bytes', 'address', 'uint256'],
                    [image, author, requestId]
                )]
            )
        )]
    };

    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "aigc_verifier_js/aigc_verifier.wasm",
        "circuit_final.zkey"
    );

    // Format proof for Solidity verifier
    const formattedProof = ethers.utils.defaultAbiCoder.encode(
        ['bytes'],
        [ethers.utils.defaultAbiCoder.encode(
            ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
            [proof.pi_a, proof.pi_b, proof.pi_c]
        )]
    );

    return { proof: formattedProof, publicSignals };
}
