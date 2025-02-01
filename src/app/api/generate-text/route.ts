import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Together from "together-ai";

// Initialize Together AI client
const together = new Together({ 
  apiKey: process.env.TOGETHER_API_KEY 
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await together.chat.completions.create({
      messages: body.messages || [],
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      max_tokens: body.max_tokens || 1000,
      temperature: body.temperature || 0.7,
      top_p: body.top_p || 0.7,
      top_k: body.top_k || 50,
      repetition_penalty: body.repetition_penalty || 1,
      stop: ["<｜end▁of▁sentence｜>"]
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Together AI API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
