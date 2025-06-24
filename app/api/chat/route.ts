import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import fs from "fs";
import path from "path";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model, editorContext } = await req.json();

  let selectedModel;
  switch (model) {
    case "gemini-2.5-flash":
      selectedModel = google("gemini-2.5-flash-preview-04-17");
      break;
    case "gpt-4.1-mini":
      selectedModel = openai("gpt-4.1-mini");
      break;
    default:
      selectedModel = google("gemini-2.5-flash-preview-04-17");
  }

  const systemPromptPath = path.join(process.cwd(), "lib", "system-prompt.md");
  const systemPrompt = fs.readFileSync(systemPromptPath, "utf8");

  const result = streamText({
    model: selectedModel,
    system: systemPrompt,
    messages: [
      ...messages,
      {
        role: "user",
        content: editorContext,
      },
    ],
  });

  return result.toDataStreamResponse();
}
