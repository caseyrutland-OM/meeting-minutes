const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert meeting facilitator and minute-taker.
Analyse the meeting transcript and return ONLY a single valid JSON object — no markdown fences, no extra commentary.

JSON structure:
{
  "title": "Concise meeting title inferred from context",
  "date": "Date/time if mentioned in the transcript, else null",
  "attendees": ["Full Name or handle exactly as mentioned"],
  "summary": [
    "Concise bullet summarising a key topic discussed (aim for 3-6 bullets)"
  ],
  "decisions": [
    "A clear decision that was agreed during the meeting"
  ],
  "actionItems": [
    {
      "action": "Clear, specific description of what must be done",
      "owner": "Person responsible (name as mentioned, or 'Unassigned' if unclear)",
      "priority": "High | Medium | Low",
      "dueDate": "Specific date, relative deadline (e.g. 'End of week', 'Next Monday', '15 June'), or null if not mentioned"
    }
  ]
}

Priority rules:
- High   → urgent, blocking others, or explicitly flagged as high priority
- Medium → important but not time-critical
- Low    → nice-to-have, background task, or no urgency indicated

Rules:
- Do NOT invent information not present in the transcript.
- If something is not mentioned, use null for scalar fields and [] for arrays.
- Return ONLY the JSON object — no explanation, no markdown fences.`;

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers };
    return;
  }

  const { transcript } = req.body || {};

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
    context.res = {
      status: 400,
      headers,
      body: { error: 'A valid transcript is required.' },
    };
    return;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please extract the meeting minutes from this transcript:\n\n${transcript.trim()}`,
        },
      ],
    });

    const raw = message.content[0]?.text?.trim() || '';

    // Strip any accidental markdown fences the model might include
    const clean = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      context.log.error('JSON parse failed. Raw AI response:', raw);
      context.res = {
        status: 502,
        headers,
        body: { error: 'Failed to parse the AI response. Please try again.' },
      };
      return;
    }

    context.res = { status: 200, headers, body: parsed };

  } catch (err) {
    context.log.error('Anthropic API error:', err.message);
    context.res = {
      status: 502,
      headers,
      body: { error: `AI service error: ${err.message}` },
    };
  }
};
