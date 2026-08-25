const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'groq/compound-mini';
const VISION_MODEL = 'qwen/qwen3.6-27b';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are FitPilot AI, a knowledgeable and friendly fitness assistant. You help users with:
- Workout recommendations and exercise form tips
- Nutrition advice and meal planning
- Recovery and rest day guidance
- Fitness goal setting and progress tracking
- General health and wellness questions

Guidelines:
- Be encouraging and supportive
- Give evidence-based advice
- Keep responses concise (2-4 sentences unless detail is needed)
- If a question is outside fitness/health, gently redirect to fitness topics
- Never give medical advice; recommend consulting a professional for health conditions`;

export async function* streamChat(
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed JSON chunks
      }
    }
  }
}

interface DetectedFood {
  food: string;
  estimated_grams: number;
}

export interface VisionAnalysisResult {
  foods: DetectedFood[];
  raw_text: string;
}

const VISION_SYSTEM_PROMPT = `You are analyzing a food photograph for a nutrition estimation system.

Identify the visible food items in the photo.
Estimate the approximate edible portion of each item in grams.
Do not invent hidden ingredients.
Do not claim exact measurements.
If something is unclear, make your best estimate.

IMPORTANT: Do NOT use thinking tags. Do NOT explain. Just output the JSON array directly.

Return ONLY a JSON array starting with [ and ending with ]. No markdown. No code fences. No explanation.

Each item must have:
- "food": the name of the food (lowercase, simple English)
- "estimated_grams": estimated portion in grams (number)

Example of exact output format:
[{"food": "rice", "estimated_grams": 200}, {"food": "egg", "estimated_grams": 100}]`;

export async function analyzeMealImage(base64DataUrl: string): Promise<VisionAnalysisResult> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this meal photo. Identify each food item and estimate its portion in grams. Return ONLY the JSON array.' },
            { type: 'image_url', image_url: { url: base64DataUrl } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq vision API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  const message = result.choices?.[0]?.message;
  const allText = ((message?.content || '') + ' ' + (message?.reasoning || '')).trim();

  let cleaned = allText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    jsonMatch = allText.match(/\[[\s\S]*\]/);
  }
  if (!jsonMatch) {
    console.error('[SCANNER] Vision response has no JSON array. finish_reason:', result.choices?.[0]?.finish_reason, 'content_len:', message?.content?.length || 0);
    throw new Error('No JSON array found in vision response.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown[];

  const foods: DetectedFood[] = parsed
    .filter((item): item is { food: string; estimated_grams: number } =>
      typeof item === 'object' &&
      item !== null &&
      'food' in item &&
      'estimated_grams' in item &&
      typeof (item as Record<string, unknown>).food === 'string' &&
      typeof (item as Record<string, unknown>).estimated_grams === 'number'
    )
    .map((item) => ({
      food: String(item.food).trim().toLowerCase(),
      estimated_grams: Math.max(1, Math.round(Number(item.estimated_grams))),
    }));

  return { foods, raw_text: cleaned };
}
