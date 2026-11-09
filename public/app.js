
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");

let conversationId = "";

function addMessage(content, role, withActions = false) {
  const message = document.createElement("div");
  message.className = `message ${role}-message`;
  message.textContent = content;

  chatMessages.appendChild(message);

  if (withActions && role === "assistant") {
    addMessageActions(message, content);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}

function isPlanAnswer(content) {
  const planKeywords = [
    "院校推荐方案",
    "冲刺",
    "稳妥",
    "保底"
  ];

  const matched = planKeywords.filter(keyword =>
    content.includes(keyword)
  );

  return content.includes("院校推荐方案") ||
    matched.length >= 3;
}

function addMessageActions(message, content) {
  const actions = document.createElement("div");
  actions.className = "message-actions";

  const likeButton = createActionButton("👍", "点赞");
  const dislikeButton = createActionButton("👎", "点踩");
  const humanButton = createActionButton("人工顾问", "转人工");

  likeButton.addEventListener("click", () => {
    likeButton.classList.toggle("active");
    dislikeButton.classList.remove("active");
  });

  dislikeButton.addEventListener("click", () => {
    dislikeButton.classList.toggle("active");
    likeButton.classList.remove("active");
  });

  humanButton.addEventListener("click", () => {
    showActionNotice(actions, "人工顾问入口暂未配置，请稍后联系服务老师。");
  });

  actions.appendChild(likeButton);
  actions.appendChild(dislikeButton);
  actions.appendChild(humanButton);

  if (isPlanAnswer(content)) {
    const changeButton = createActionButton("换一批", "换一批院校方案");
    changeButton.addEventListener("click", () => {
      sendMessage("请沿用我的学生背景，再推荐一批不同的院校，不要重复之前推荐过的学校。");
    });
    actions.appendChild(changeButton);
  }

  message.appendChild(actions);
}

function createActionButton(icon, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "message-action";
  button.textContent = icon;
  button.title = label;
  return button;
}

function showActionNotice(container, text) {
  let notice = container.querySelector(".action-notice");

  if (!notice) {
    notice = document.createElement("span");
    notice.className = "action-notice";
    container.appendChild(notice);
  }

  notice.textContent = text;
}

async function sendMessage(text) {
  const query = text.trim();

  if (!query || sendButton.disabled) return;

  addMessage(query, "user");

  chatInput.value = "";
  resizeInput();

  sendButton.disabled = true;
  sendButton.textContent = "思考中...";

  const loadingMessage = addMessage(
    "正在分析你的问题，请稍候...",
    "assistant"
  );

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

    const answer = data.answer || "暂时没有收到回复，请重新尝试。";

    loadingMessage.textContent = answer;

    addMessageActions(loadingMessage, answer);

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

function resizeInput() {
  chatInput.style.height = "auto";
  chatInput.style.height =
    Math.min(chatInput.scrollHeight, 180) + "px";
}

chatForm.addEventListener("submit", function(event) {
  event.preventDefault();
  sendMessage(chatInput.value);
});

chatInput.addEventListener("keydown", function(event) {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  ) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatInput.addEventListener("input", resizeInput);

document.querySelectorAll(".quick-question").forEach(button => {
  button.addEventListener("click", function() {
    sendMessage(button.textContent);
  });
});
