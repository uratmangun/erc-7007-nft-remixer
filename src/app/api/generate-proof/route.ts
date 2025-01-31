import { NextRequest, NextResponse } from 'next/server';
import { generateProof } from '../../../../circuits/generate_proof.js';
import { ethers } from 'ethers';

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

        // Encode AIGCData struct
        const abiCoder = new ethers.AbiCoder();
        const aigcData = abiCoder.encode(
            ['tuple(bytes,address,uint256)'],
            [[image, author, requestId]]
        );
        
        // Generate the proof
        const { proof, publicSignals } = await generateProof(
            prompt,
            image,
            author,
            requestId
        );

        // Create the final response with all necessary data for the contract call
        return NextResponse.json({
            prompt: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(prompt)),
            aigcData,
            proof,
            publicSignals
        });
    } catch (error) {
        console.error('Error generating proof:', error);
        return NextResponse.json(
            { error: 'Failed to generate proof' },
            { status: 500 }
        );
    }
}
