const API_KEY = "AIzaSyD0jWCXKjfIu2fa_X0fFzb2Vr4QQ5FptKk"; // <-- Thay bằng API key của bạn

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
      contents: [{ parts: [{ text: userInput }] }]
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
