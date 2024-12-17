import { NextRequest, NextResponse } from "'next/server'";
import AWS from "'aws-sdk'";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const polly = new AWS.Polly();

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    const params = {
      Text: text,
      OutputFormat: "'mp3'",
      VoiceId: voice || "'Joanna'"
    };

    const data = await polly.synthesizeSpeech(params).promise();
    
    return new NextResponse(data.AudioStream as Buffer, {
      headers: {
        "'Content-Type'": "'audio/mpeg'",
        "'Content-Disposition'": "'attachment; filename=speech.mp3'"
      }
    });
  } catch (error) {
    console.error("'Error generating speech:'", error);
    return NextResponse.json({ error: "'Error generating speech'" }, { status: 500 });
  }
}

