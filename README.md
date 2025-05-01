# Layercode Conversational AI Backend (Express)

A minimal TypeScript backend using **Express** to provide a `/agent` endpoint for streaming conversational AI responses, compatible with Layercode's voice pipelines. This implementation mirrors the Hono/Cloudflare Workers example, but is designed for traditional Node.js/Bun environments.

---

## ✨ Features

- **Session state** stored in memory – one history per user (per process).
- **Real-time streaming** – incremental `response.tts` chunks delivered via SSE (using [`@layercode/node-server-sdk`](https://www.npmjs.com/package/@layercode/node-server-sdk)).
- **Google Gemini SDK** integration (`@ai-sdk/google`).
- **Express** – familiar, fast, and easy to run locally or deploy anywhere.
- **Graceful fall-backs** – friendly responses on errors.

---

## 🚀 Quick Start

> Requires **[Bun](https://bun.sh) 1.0+**, a valid **Gemini API key**, and a **Layercode webhook secret**.

```bash
# Install dependencies
bun install

# Start the server
bun run index.ts
```

The server will listen on port `3001` by default.

---

## 🗺️ API

### POST `/agent`

Send the user's text and receive streamed chunks. Requires a valid Layercode webhook signature.

#### Headers

```
layercode-signature: <webhook-signature>
```

#### Request JSON

```jsonc
{
  "text": "Hello, how are you?",
  "type": "message", // "message" or "session.start"
  "session_id": "sess-1234"
}
```

#### Streaming Response (SSE)

All streaming and SSE response handling is managed by [`@layercode/node-server-sdk`](https://www.npmjs.com/package/@layercode/node-server-sdk), which provides a simple interface for sending TTS and data chunks to the client, abstracting away manual SSE logic.

```
data: {"type":"response.tts","content":"Hi there!","turn_id":"turn-0001"}

data: {"type":"response.end","turn_id":"turn-0001"}
```

| Type           | Description                         |
| -------------- | ----------------------------------- |
| `response.tts` | A partial or complete chunk of text |
| `response.end` | Indicates the turn has finished     |

#### Implementation Notes

- The `/agent` endpoint uses Node.js 18+ [`Readable.fromWeb`](https://nodejs.org/api/stream.html#readablefromwebstream-options) to convert the Fetch API `Response.body` stream to a Node.js stream for Express.
- The route handler **does not return a value**; it streams the response directly to the client using `nodeStream.pipe(res)`.
- Make sure you are running on **Node.js 18 or newer** for streaming support.

---

## 🧩 Project Structure

| Path        | Purpose                          |
| ----------- | -------------------------------- |
| `agent.ts`  | `/agent` endpoint implementation |
| `index.ts`  | Express app entrypoint & routing |
| `README.md` | You are here                     |

---

## 🛠️ Dependencies

- `express` – web framework for Node.js/Bun
- `@ai-sdk/google` – Gemini SDK
- `ai` – streaming and message handling
- `@layercode/node-server-sdk` – abstracts SSE streaming, response handling, and webhook verification

All dependencies are managed in `bun.lock` and `package.json`.

---

## 🩹 Troubleshooting

| Symptom                                   | Fix                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY is not set` | Export var or add to `.env`                                                 |
| `LAYERCODE_WEBHOOK_SECRET is not set`     | Export var or add to `.env`                                                 |
| `401 Unauthorized` response               | Check webhook signature and secret match                                    |
| Empty or truncated response               | Check session consistency & logs                                            |
| Server not responding                     | Check logs and port configuration                                           |
| Express type error on handler return      | Do not return a value from the handler; stream or end the response directly |
| TypeScript error with Readable.fromWeb    | Use `Readable.fromWeb(response.body as any)` and ensure Node.js 18+         |

---

## 🔐 Security Notes

- Do **not** commit your secrets.
- Use HTTPS & proper auth in production.
- Consider rate-limiting and persistence (e.g., Redis, DB) for sessions.
- Ensure `LAYERCODE_WEBHOOK_SECRET` is properly set and kept secure.

---

## 📝 License

No LICENSE file in this directory. See the root of the Layercode repo for license details.
