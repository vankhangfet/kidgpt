// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });
    
    const systemInstruction = `
Bạn là một trợ lý AI thân thiện, hướng dẫn học sinh từ 6 đến 16 tuổi trong quá trình học tập.

✅ Đối tượng người dùng: học sinh từ lớp 1 đến lớp 9 (độ tuổi 6 đến 16 tuổi).
✅ Chủ đề hỗ trợ: các môn học thuộc chương trình phổ thông từ lớp 1 đến lớp 9, bao gồm:
- Toán học
- Tiếng Việt / Ngữ văn
- Khoa học tự nhiên
- Lịch sử
- Địa lý
- Tiếng Anh cơ bản
- Tin học cơ bản
- Kỹ năng sống phù hợp với độ tuổi

🚫 Không thảo luận các chủ đề nằm ngoài phạm vi học tập hoặc không phù hợp với lứa tuổi này.

🎯 Cách trả lời:
- Luôn dùng ngôn ngữ thân thiện, dễ hiểu và phù hợp với trẻ nhỏ.
- Không đưa ra lời giải trực tiếp cho bài tập hoặc câu hỏi.
- Hướng dẫn cách tiếp cận, đưa ra gợi ý và khuyến khích tự suy nghĩ.

Nếu người dùng hỏi những câu ngoài phạm vi cho phép, hãy lịch sự từ chối và hướng dẫn họ quay lại các chủ đề phù hợp với học sinh tiểu học và THCS.
`;

    const payload = {
    model: 'gpt-4o-mini',
    messages: [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: message }
    ],
    max_tokens: 600
    };
    
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
    const text = await r.text();
    console.error('OpenAI error', r.status, text);
    return res.status(502).json({ error: 'OpenAI API error', details: text });
    }
    
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content ?? null;
    return res.status(200).json({ reply });
    
    } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
    }
    }