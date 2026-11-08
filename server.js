
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Dify API 配置
const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages";

app.post("/api/chat", async (req, res) => {
  try {
    const { query, conversation_id } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        error: "请输入咨询内容"
      });
    }

    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "服务器尚未配置 Dify API Key"
      });
    }

    const response = await fetch(DIFY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
inputs: {
  current_date: new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date())
},
        query: query.trim(),
        response_mode: "blocking",
        conversation_id: conversation_id || "",
        user: "study-abroad-user"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Dify API error:", data);

      return res.status(response.status).json({
        error: data.message || "AI 服务暂时不可用"
      });
    }

    res.json({
      answer: data.answer || "",
      conversation_id: data.conversation_id || ""
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "服务器发生错误，请稍后重试"
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
