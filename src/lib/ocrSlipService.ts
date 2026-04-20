/**
 * OCR Slip Service
 * อ่านข้อมูลจากสลิปโอนเงิน โดยใช้ Claude Vision API (claude-haiku-4-5)
 * เรียกตรงจาก browser ผ่าน VITE_ANTHROPIC_API_KEY
 */

export interface SlipData {
  amount: number | null;
  date: string | null;         // YYYY-MM-DD
  time: string | null;         // HH:MM
  senderName: string | null;
  senderBank: string | null;
  receiverName: string | null;
  receiverBank: string | null;
  referenceNo: string | null;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface OcrResult {
  data: SlipData | null;
  error: string | null;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data URL prefix
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const readSlip = async (file: File): Promise<OcrResult> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    return { data: null, error: 'ไม่พบ VITE_ANTHROPIC_API_KEY ใน .env.local' };
  }

  try {
    const imageBase64 = await fileToBase64(file);
    const mediaType = (file.type || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageBase64 },
              },
              {
                type: 'text',
                text: `วิเคราะห์สลิปการโอนเงินนี้และดึงข้อมูลออกมา ตอบในรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่น:

{
  "amount": <จำนวนเงิน เป็น number ไม่มีหน่วย เช่น 1500.00 หรือ null>,
  "date": <วันที่ รูปแบบ YYYY-MM-DD หรือ null>,
  "time": <เวลา รูปแบบ HH:MM หรือ null>,
  "senderName": <ชื่อผู้โอน หรือ null>,
  "senderBank": <ชื่อธนาคารผู้โอน เช่น "กสิกรไทย" หรือ null>,
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
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { data: null, error: `API error ${response.status}: ${err}` };
    }

    const json = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const textBlock = json.content.find((c) => c.type === 'text');
    if (!textBlock) return { data: null, error: 'ไม่ได้รับข้อมูลจาก API' };

    const raw = textBlock.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const slipData: SlipData = JSON.parse(raw) as SlipData;

    return { data: slipData, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านสลิป',
    };
  }
};
