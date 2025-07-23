import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { tool, streamText } from "ai";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  console.log(process.env.OPENAI_API_KEY);

  let selectedModel;
  switch (model) {
    case "gemini-2.5-flash":
      selectedModel = google("gemini-2.5-flash");
      break;
    case "gpt-4.1-mini":
      selectedModel = openai("gpt-4.1-mini");
      break;
    default:
      selectedModel = google("gemini-2.5-flash");
  }

  const systemPromptPath = path.join(process.cwd(), "docs", "system-prompt.md");
  const systemPrompt = fs.readFileSync(systemPromptPath, "utf8");

  const result = streamText({
    model: selectedModel,
    system: systemPrompt,
    messages,
    toolCallStreaming: true,
    tools: {
      editFile: tool({
        description: "Edit the file",
        parameters: z.object({
          newFile: z
            .string()
            .describe(
              "The new file with all the edits made, which will replace the current file"
            ),
        }),
      }),
    },
  });

  return result.toDataStreamResponse({ getErrorMessage: errorHandler });
}
