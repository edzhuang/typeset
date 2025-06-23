import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  let selectedModel;
  switch (model) {
    case 'gemini-2.5-flash':
      selectedModel = google('gemini-2.5-flash-preview-04-17');
      break;
    case 'gpt-4.1-mini':
      selectedModel = openai('gpt-4.1-mini'); // You can change to a different OpenAI model if needed
      break;
    default:
      selectedModel = openai('gemini-2.5-flash-preview-04-17');
  }

  const result = streamText({
    model: selectedModel,
    messages,
  });

  return result.toDataStreamResponse();
}