const API_KEY = "AIzaSyD0jWCXKjfIu2fa_X0fFzb2Vr4QQ5FptKk"; // <-- Thay bằng API key của bạn

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

document.getElementById("sendBtn").addEventListener("click", async () => {
  const userInput = document.getElementById("userInput").value;
  if (!userInput.trim()) return;

  addMessage("Bạn", userInput, "user");

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "user", parts: [{ text: userInput }] }
      ]
    })
  });

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không nhận được phản hồi.";
  addMessage("GenAI", reply, "bot");
  document.getElementById("userInput").value = "";
});

function addMessage(sender, text, type) {
  const chatbox = document.getElementById("chatbox");
  const message = document.createElement("div");
  message.className = "message " + type;
  message.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatbox.appendChild(message);
  chatbox.scrollTop = chatbox.scrollHeight;
}
