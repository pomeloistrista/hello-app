import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('正在连接后端...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('后端连接失败: ' + err.message))
  }, [])

  return (
    <div className="container">
      <h1>你好 👋</h1>
      <p className="backend-line">后端说：{message}</p>
    </div>
  )
}

export default App
