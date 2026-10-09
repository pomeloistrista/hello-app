import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('正在连接后端...')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('后端连接失败: ' + err.message))
  }, [])

  const handleParse = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('请求失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>你好 👋</h1>
      <p className="backend-line">后端说：{message}</p>

      <div className="parse-box">
        <h2>心意卡片解析器</h2>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='说一句随意的话，比如"我妈说她腰疼"'
          onKeyDown={(e) => e.key === 'Enter' && handleParse()}
        />
        <button onClick={handleParse} disabled={loading}>
          {loading ? '解析中...' : '解析'}
        </button>
        {error && <p className="error">{error}</p>}
        {result && (
          <pre className="json-output">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}

export default App
