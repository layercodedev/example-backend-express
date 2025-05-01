import type { RequestHandler } from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import type { CoreMessage } from "ai";
import { verifySignature, streamResponse } from "@layercode/node-server-sdk";
import { Readable } from "node:stream"; // Node.js 18+ only

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const sessionMessages: Record<string, CoreMessage[]> = {};

const SYSTEM_PROMPT =
  "You are a helpful conversation assistant. You should respond to the user's message in a conversational manner. Your output will be spoken by a TTS model. You should respond in a way that is easy for the TTS model to speak and sound natural.";
const WELCOME_MESSAGE = "Welcome to Layercode. How can I help you today?";

export const onRequestPost: RequestHandler = async (req, res) => {
  const requestBody = req.body;
  const signature = req.header("layercode-signature") || "";
  const secret = process.env.LAYERCODE_WEBHOOK_SECRET || "";
  const payload = JSON.stringify(requestBody);
  const isValid = verifySignature({ payload, signature, secret });
  if (!isValid) {
    console.error("Invalid signature", signature, secret, payload);
    res.status(401).send("Unauthorized");
    return;
  }

  console.log("Request body received from Layercode", requestBody);
  const { session_id, text, type } = requestBody;

  let messages = sessionMessages[session_id] || [];
  messages.push({ role: "user", content: [{ type: "text", text }] });

  let response;
  if (type === "session.start") {
    response = streamResponse(
      requestBody,
      async ({ stream }: { stream: any }) => {
        stream.tts(WELCOME_MESSAGE);
        messages.push({
          role: "assistant",
          content: [{ type: "text", text: WELCOME_MESSAGE }],
        });
        stream.end();
      }
    );
  } else {
    response = streamResponse(
      requestBody,
      async ({ stream }: { stream: any }) => {
        try {
          const { textStream } = streamText({
            model: google("gemini-2.0-flash-001"),
            system: SYSTEM_PROMPT,
            messages,
            onFinish: async ({ response }: { response: any }) => {
              messages.push(...response.messages);
              console.log(
                "Current message history for session",
                session_id,
                JSON.stringify(messages, null, 2)
              );
              sessionMessages[session_id] = messages;
            },
          });
          stream.data({
            textToBeShown: "Hello, how can I help you today?",
          });
          await stream.ttsTextStream(textStream);
        } catch (err) {
          console.error("Handler error:", err);
        } finally {
          console.log("Stream ended");
          stream.end();
        }
      }
    );
  }

  // Set headers and status
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.status(response.status);

  if (response.body) {
    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.pipe(res);
  } else {
    res.end();
  }
};
