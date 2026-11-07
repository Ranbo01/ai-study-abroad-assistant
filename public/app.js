
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");

let conversationId = "";

function addMessage(content, role) {
  const message = document.createElement("div");
  message.className = `message ${role}-message`;
  message.textContent = content;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}

async function sendMessage(text) {
  const query = text.trim();

  if (!query) return;

  addMessage(query, "user");

  chatInput.value = "";
  sendButton.disabled = true;
  sendButton.textContent = "思考中...";

  const loadingMessage = addMessage("正在分析你的问题，请稍候...", "assistant");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        conversation_id: conversationId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "请求失败，请稍后重试");
    }

    conversationId = data.conversation_id || conversationId;

    loadingMessage.textContent =
      data.answer || "暂时没有收到回复，请重新尝试。";

  } catch (error) {
    loadingMessage.textContent =
      error.message || "网络异常，请稍后重试。";
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "发送 ↑";
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.focus();
  }
}

chatForm.addEventListener("submit", function(event) {
  event.preventDefault();
  sendMessage(chatInput.value);
});

document.querySelectorAll(".quick-question").forEach(button => {
  button.addEventListener("click", function() {
    sendMessage(button.textContent);
  });
});
