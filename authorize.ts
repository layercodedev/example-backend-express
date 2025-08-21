import type { RequestHandler } from 'express';

export const onRequestPost: RequestHandler = async (req, res) => {
  try {
    const response = await fetch('https://api.layercode.com/v1/agents/authorize_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LAYERCODE_API_KEY}`,
      },
      body: JSON.stringify({ agent_id: 'your-agent-id', session_id: null }),
    });
    if (!response.ok) {
      console.log('response not ok', response.statusText);
      res.json({ error: response.statusText });
    }
    const data: { client_session_key: string } = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ error: error });
  }
};
