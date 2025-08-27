// هذا الكود يوضع في ملف /api/chat.js

export default async function handler(req, res) {
  // التأكد من أن الطلب هو POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, sessionID } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // التحقق من وجود مفتاح API
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on the server.' });
    }

    // إعداد شخصية مُعين
    const systemInstruction = "أنت 'مُعين'، مستشار قانوني رقمي متخصص حصريًا في القوانين والتشريعات السعودية. ردودك يجب أن تكون رسمية ومباشرة. أنهِ كل إجابة بجملة إخلاء المسؤولية: 'إخلاء مسؤولية: هذه المعلومات هي استشارة أولية توعوية ولا تعتبر بديلاً عن محامٍ مرخص.'";

    const requestBody = {
      "contents": [
        { "role": "user", "parts": [{ "text": systemInstruction }] },
        { "role": "model", "parts": [{ "text": "فهمت." }] },
        { "role": "user", "parts": [{ "text": message }] }
      ]
    };

    // إرسال الطلب إلى Gemini AI
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    // التحقق من وجود رد صالح
    if (!responseData.candidates || !responseData.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API.');
    }

    const aiReply = responseData.candidates[0].content.parts[0].text;

    // إرجاع الرد للواجهة
    // ملاحظة: تسجيل المحادثات يمكن إضافته هنا لاحقًا عبر ربط Vercel بـ Google Sheets API
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error('Error in Vercel function:', error);
    res.status(500).json({ error: error.message });
  }
}
