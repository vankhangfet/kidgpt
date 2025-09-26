
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

  addMessage("GenAI", "Đang suy nghĩ...", "bot");
  const loadingIndex = document.querySelectorAll(".bot .bubble").length - 1;

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });
      
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      document.querySelectorAll(".bot .bubble")[loadingIndex].textContent = 'Error: ' + (err.error || resp.statusText || resp.status);
      return;
    }
      
    const data = await resp.json();
    const reply = data.reply || "Mình chưa hiểu rõ lắm. Bạn thử hỏi lại được không?";
    document.querySelectorAll(".bot .bubble")[loadingIndex].innerHTML = reply;
  } catch (err) {
    console.error('API call error:', err);
    document.querySelectorAll(".bot .bubble")[loadingIndex].textContent = `Lỗi kết nối hoặc API key không hợp lệ.`;
  }
}

function addMessage(sender, text, type) {
  const chatbox = document.getElementById("chatbox");
  const message = document.createElement("div");
  message.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = type === "bot" ? "🤖" : "👤";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.appendChild(avatar);
  message.appendChild(bubble);
  chatbox.appendChild(message);
  chatbox.scrollTop = chatbox.scrollHeight;
}
