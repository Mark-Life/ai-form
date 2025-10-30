import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech as generateSpeech } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text }: { text: string } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response("Text is required", { status: 400 });
    }

    const result = await generateSpeech({
      model: openai.speech("tts-1"),
      text,
      voice: "shimmer",
    });

    const audioFile = result.audio;
    const audioData = audioFile?.uint8Array;

    if (!audioData) {
      return new Response("No audio data generated", { status: 500 });
    }

    return new Response(new Uint8Array(audioData).buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    return new Response(
      `Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
