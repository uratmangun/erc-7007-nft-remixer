import { NextResponse } from 'next/server';
import Together from "together-ai";

// Initialize Together AI client
const together = new Together({ 
    apiKey: process.env.TOGETHER_API_KEY 
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const response = await together.images.create({
            model: "black-forest-labs/FLUX.1-schnell-Free",
            prompt: prompt,
            width: 256,
            height: 256,
            steps: 1,
            n: 1,
            response_format: "url"
        });

        return NextResponse.json({
            success: true,
            image: response.data[0].url
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
