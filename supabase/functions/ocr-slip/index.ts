import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface SlipData {
  amount: number | null;
  date: string | null;         // ISO date string YYYY-MM-DD
  time: string | null;         // HH:MM
  senderName: string | null;
  senderBank: string | null;
  receiverName: string | null;
  receiverBank: string | null;
  referenceNo: string | null;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as { imageBase64: string; mediaType?: string };
    const { imageBase64, mediaType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `วิเคราะห์สลิปการโอนเงินนี้และดึงข้อมูลทั้งหมดออกมา ตอบในรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่น:

{
  "amount": <จำนวนเงิน เป็น number ไม่มีหน่วย เช่น 1500.00>,
  "date": <วันที่ รูปแบบ YYYY-MM-DD หรือ null>,
  "time": <เวลา รูปแบบ HH:MM หรือ null>,
  "senderName": <ชื่อผู้โอน หรือ null>,
  "senderBank": <ชื่อธนาคารผู้โอน เช่น "กสิกรไทย", "ไทยพาณิชย์", "กรุงไทย" หรือ null>,
  "receiverName": <ชื่อผู้รับ หรือ null>,
  "receiverBank": <ชื่อธนาคารผู้รับ หรือ null>,
  "referenceNo": <เลขอ้างอิง/เลขที่รายการ หรือ null>,
  "rawText": <ข้อความทั้งหมดที่อ่านได้จากสลิป>,
  "confidence": <"high" ถ้าอ่านชัดเจน, "medium" ถ้าบางส่วนไม่ชัด, "low" ถ้าไม่แน่ใจ>
}`,
            },
          ],
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON from response (strip markdown code blocks if present)
    const raw = textContent.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const slipData: SlipData = JSON.parse(raw);

    return new Response(JSON.stringify({ data: slipData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OCR error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
