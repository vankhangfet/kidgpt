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

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

// When page is loaded.
window.addEventListener("DOMContentLoaded", async () => {
  // Hiển thị lời chào mặc định từ chatbot
  const welcomeMessage = "👋 Xin chào! Mình là trợ lý học tập GenAI. Mình sẽ giúp bạn học tốt hơn các môn từ lớp 1 đến lớp 9. Bạn muốn hỏi gì nào?";
  addMessage("GenAI", welcomeMessage, "bot");
});


async function sendMessage() {
  const input = document.getElementById("userInput");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage("Bạn", userMessage, "user");
  input.value = "";

  addMessage("GenAI", "Đang trả lời...", "bot");
  const loadingIndex = document.querySelectorAll(".bot").length - 1;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`, {
      method: "POST",
      headers:  {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "user", parts: [{ text: userMessage }] }
        ]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không nhận được phản hồi.";
    document.querySelectorAll(".bot")[loadingIndex].innerHTML = `<strong>GenAI:</strong> ${reply}`;
  } catch (err) {
    document.querySelectorAll(".bot")[loadingIndex].innerHTML = `<strong>GenAI:</strong> Lỗi kết nối hoặc API key không hợp lệ.`;
  }
}

function addMessage(sender, text, type) {
  const chatbox = document.getElementById("chatbox");
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

