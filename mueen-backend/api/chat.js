// ===================================================================================
// هذا هو الكود النهائي والكامل الذي يجب وضعه في ملف chat.js على GitHub.
// يحتوي هذا الإصدار على التصحيح الأمني (CORS) الذي سيحل مشكلة "فشل الاتصال بالخادم".
// ===================================================================================

/**
 * دالة مساعدة لإضافة CORS headers للسماح بالاتصال من أي موقع.
 * @param {object} res - كائن الاستجابة من Vercel.
 */
const allowCors = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // يسمح بالاتصال من أي نطاق
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

export default async function handler(req, res) {
  // تطبيق إعدادات CORS على كل الطلبات
  allowCors(res);

  // المتصفح يرسل طلب "OPTIONS" قبل الطلب الفعلي للتحقق من الأمان
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // التأكد من أن الطلب هو من نوع POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

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

    if (!responseData.candidates || !responseData.candidates[0].content) {
      const errorReason = responseData.promptFeedback ? responseData.promptFeedback.blockReason : 'Invalid response structure';
      throw new Error(`Gemini API Error: ${errorReason}`);
    }

    const aiReply = responseData.candidates[0].content.parts[0].text;

    // إرجاع الرد للواجهة
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error('Error in Vercel function:', error);
    res.status(500).json({ error: error.message });
  }
}
