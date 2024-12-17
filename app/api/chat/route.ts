import { NextRequest, NextResponse } from "'next/server'";
import OpenAI from "'openai'";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",  // Updated to use GPT-4
      messages: [{ role: "user", content: message }],
      temperature: 0.7,  // Adjust for desired creativity vs consistency
      max_tokens: 300,  // Adjust based on desired response length
    });

    const response = chatCompletion.choices[0].message.content;

    return NextResponse.json({ response });
  } catch (error) {
    console.error("'Error calling OpenAI:'", error);
    return NextResponse.json({ error: "'Error generating response'" }, { status: 500 });
  }
}

