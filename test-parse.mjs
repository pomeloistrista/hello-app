// 本地命令行测试脚本：验证 Prompt v1 + DeepSeek API
// 用法: $env:DEEPSEEK_API_KEY="sk-xxx"; node test-parse.mjs "我妈说她腰疼" "朋友生日快到了"
const API_URL = "https://api.deepseek.com/chat/completions";
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("❌ 请先设置环境变量 DEEPSEEK_API_KEY");
  process.exit(1);
}

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

async function parse(input) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT + input }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error("API 错误: " + JSON.stringify(data));
  }
  return data.choices?.[0]?.message?.content;
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("❌ 用法: node test-parse.mjs \"句子1\" \"句子2\" ...");
  process.exit(1);
}

for (const input of inputs) {
  console.log("\n" + "=".repeat(50));
  console.log("📥 输入:", input);
  try {
    const content = await parse(input);
    console.log("📤 输出:", content);
  } catch (err) {
    console.error("❌ 失败:", err.message);
  }
}
