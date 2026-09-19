export default function handler(req, res) {
  res.status(200).json({
    message: "你好！这条消息来自 Vercel Serverless Function 后端 🚀",
    timestamp: new Date().toISOString(),
  });
}
