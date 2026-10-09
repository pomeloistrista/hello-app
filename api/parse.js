const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const SYSTEM_PROMPT = `你是一个帮人记住"对身边人的心意"的助手。
用户会说一句很随意的话，可能不完整、没有主语、没有动作。
把它变成一张可执行的卡片，只输出 JSON，不要任何其他文字。
规则：
1. person 用用户的原始称呼（"我妈"→"妈妈"，"老王"→"老王"），不要自作主张改名
2. actions 必须具体到能立刻动手，禁止"多关心她"这类空话；给 1-3 条，按先后顺序
3. 健康、道歉、承诺类 → urgency 高；礼物、惊喜类 → 看是否有时间点
4. 如果连对象是谁都判断不出，confidence 给 0.3 以下，person 填 "未知"
5. 不要编造用户没提过的信息（别假设妈妈住在老家、别假设生日快到了）

用户输入：`;

export default async function handler(req, res) {
  // 只接受 POST 请求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "请使用 POST 请求" });
  }

  // API key 从环境变量读取，不写死在代码里
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "服务端未配置 DEEPSEEK_API_KEY 环境变量" });
  }

  const { input } = req.body || {};
  if (!input || typeof input !== "string" || !input.trim()) {
    return res.status(400).json({ error: "input 不能为空" });
  }

  try {
    const resp = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + input.trim() },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("DeepSeek API error:", JSON.stringify(data));
      return res.status(502).json({ error: "DeepSeek API 调用失败", detail: data });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: "DeepSeek 返回内容为空" });
    }

    // 解析 JSON，模型偶尔会带多余文字，尝试提取
    try {
      const parsed = JSON.parse(content);
      res.status(200).json({ ok: true, data: parsed, raw: content });
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        res.status(200).json({ ok: true, data: parsed, raw: content });
      } else {
        res.status(502).json({ error: "DeepSeek 未返回有效 JSON", raw: content });
      }
    }
  } catch (err) {
    console.error("Parse function error:", err);
    res.status(500).json({ error: "服务器内部错误", detail: err.message });
  }
}
