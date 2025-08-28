// هذا الكود المحدث يوضع في ملف /api/chat.js
// يتضمن تصحيح CORS للسماح بالاتصال من Webflow

/**
 * دالة مساعدة لإضافة CORS headers.
 * @param {object} res - كائن الاستجابة من Vercel.
 */
const allowCors = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // للسماح لجميع المصادر، يمكن تقييده لاحقًا لنطاق موقعك فقط
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

export default async function handler(req, res) {
  // إضافة CORS headers لجميع الاستجابات
  allowCors(res);

  // المتصفح يرسل طلب OPTIONS أولاً للتحقق من CORS، يجب الرد عليه بنجاح
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // التأكد من أن الطلب هو POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, sessionID } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // التحقق من وجود مفتاح API في إعدادات Vercel
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

    // التحقق من وجود رد صالح من النموذج
    if (!responseData.candidates || !responseData.candidates[0].content) {
      const errorReason = responseData.promptFeedback ? responseData.promptFeedback.blockReason : 'Invalid response structure';
      throw new Error(`Gemini API Error: ${errorReason}`);
    }

    const aiReply = responseData.candidates[0].content.parts[0].text;

    // إرجاع الرد للواجهة
    // ملاحظة: تسجيل المحادثات يمكن إضافته هنا لاحقًا
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error('Error in Vercel function:', error);
    res.status(500).json({ error: error.message });
  }
}
