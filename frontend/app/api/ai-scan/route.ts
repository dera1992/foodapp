import { NextRequest, NextResponse } from 'next/server';

type ScanResult = {
  title?: string;
  brand?: string;
  category?: string;
  weight?: string;
  description?: string;
  ingredients?: string;
  nutrition?: string;
  confidence?: number;
  tags?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI scanning not configured' }, { status: 503 });
    }

    const prompt = `You are a food product identification system. Analyse this image and identify the food product.

Return ONLY a valid JSON object with these fields (leave empty string if unknown):
{
  "title": "full product name",
  "brand": "brand name",
  "category": "one of: Bakery, Dairy, Produce, Grocery, Meat, Seafood, Frozen, Beverages, Snacks, Condiments",
  "weight": "weight or quantity e.g. 500g or 1L",
  "description": "brief product description 1-2 sentences",
  "ingredients": "ingredients list as text",
  "nutrition": "key nutrition per 100g: calories, fat, protein, carbs",
  "confidence": 85,
  "tags": ["tag1", "tag2"]
}

Return ONLY the JSON object, no markdown, no explanation.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'AI scan failed' }, { status: 502 });
    }

    const anthropicData = (await anthropicRes.json()) as {
      content: { type: string; text: string }[];
    };
    const text = anthropicData.content?.find((c) => c.type === 'text')?.text ?? '';

    let result: ScanResult = {};
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      result = JSON.parse(cleaned) as ScanResult;
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]) as ScanResult;
        } catch {
          return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'No valid JSON in AI response' }, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('AI scan route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
