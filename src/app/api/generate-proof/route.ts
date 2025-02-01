import { NextRequest, NextResponse } from 'next/server';
import { encodeAbiParameters, parseAbiParameters, stringToHex } from 'viem';

// Function to generate zero-knowledge proof using Rust webserver
async function generateCircuitProof(inputs: {
    prompt: string,
    aigc_data: {
        image: string,
        author: string,
        request_id: string
    }
}) {
    try {
        // Send request to Rust webserver
        const response = await fetch('http://127.0.0.1:8084/proof', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: stringToHex(inputs.prompt),
                aigc_data: {
                    image: stringToHex(inputs.aigc_data.image),
                    author: stringToHex(inputs.aigc_data.author),
                    request_id: stringToHex(inputs.aigc_data.request_id)
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const proofData = await response.json();

        return {
            proof: proofData.proof,
            publicSignals: proofData.public_inputs,
            hashedInputs: {
                prompt: stringToHex(inputs.prompt),
                image: stringToHex(inputs.aigc_data.image),
                author: stringToHex(inputs.aigc_data.author),
                requestId: stringToHex(inputs.aigc_data.request_id)
            },
            data:{
                prompt: inputs.prompt,
                image: inputs.aigc_data.image,
                author: inputs.aigc_data.author,
                requestId: inputs.aigc_data.request_id
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
        const { prompt, aigc_data } = body;

        if (!prompt || !aigc_data || !aigc_data.image || !aigc_data.author || !aigc_data.request_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate the zero-knowledge proof using Rust webserver
        const proofData = await generateCircuitProof({
            prompt,
            aigc_data
        });

        return NextResponse.json({
            proof: proofData.proof,
            publicSignals: proofData.publicSignals,
            aigcData: proofData.hashedInputs,
            data: proofData.data
        });
    } catch (error) {
        console.error('Error in generate-proof API:', error);
        return NextResponse.json(
            { error: 'Failed to generate proof' },
            { status: 500 }
        );
    }
}
