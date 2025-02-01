import { NextRequest, NextResponse } from 'next/server';
import { encodeAbiParameters, parseAbiParameters, stringToHex } from 'viem';
import { poseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import path from 'path';

// Function to generate zero-knowledge proof
async function generateCircuitProof(inputs: {
    prompt: string,
    image: string,
    author: string,
    requestId: string
}) {
    try {
        // Get the circuit files paths
        const circuitWasmPath = path.join(process.cwd(), 'circuits', 'panda.wasm');
        const zkeyPath = path.join(process.cwd(), 'circuits', 'panda.zkey');

        // Calculate input hashes using Poseidon
        const promptHash = poseidon([BigInt(stringToHex(inputs.prompt))]);
        const imageHash = poseidon([BigInt(inputs.image)]);
        const authorHash = poseidon([BigInt(inputs.author)]);
        const requestIdHash = poseidon([BigInt(inputs.requestId)]);

        // Prepare inputs for the circuit
        const circuitInputs = {
            prompt: promptHash.toString(),
            image: imageHash.toString(),
            author: authorHash.toString(),
            requestId: requestIdHash.toString()
        };

        // Generate the proof
        const { proof, publicSignals } = await groth16.fullProve(
            circuitInputs,
            circuitWasmPath,
            zkeyPath
        );

        // Convert proof to the format expected by the smart contract
        const solidityProof = {
            pi_a: proof.pi_a,
            pi_b: proof.pi_b,
            pi_c: proof.pi_c,
            publicSignals
        };

        return {
            proof: solidityProof,
            publicSignals,
            hashedInputs: {
                promptHash: promptHash.toString(),
                imageHash: imageHash.toString(),
                authorHash: authorHash.toString(),
                requestIdHash: requestIdHash.toString()
            }
        };
    } catch (error) {
        console.error('Error generating circuit proof:', error);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, image, author, requestId } = body;

        if (!prompt || !image || !author || !requestId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate the zero-knowledge proof
        const proofData = await generateCircuitProof({
            prompt,
            image,
            author,
            requestId
        });

        // Encode AIGCData struct for contract interaction using viem
        const aigcData = encodeAbiParameters(
            parseAbiParameters('(bytes,address,uint256)'),
            [[image, author, requestId]]
        );

        // Create the final response with all necessary data
        return NextResponse.json({
            prompt: stringToHex(prompt),
            aigcData,
            proof: proofData.proof,
            publicSignals: proofData.publicSignals,
            hashedInputs: proofData.hashedInputs
        });
    } catch (error: any) {
        console.error('Error generating proof:', error);
        return NextResponse.json(
            { error: 'Failed to generate proof', details: error.message },
            { status: 500 }
        );
    }
}
