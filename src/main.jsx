import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Tailwind 必须最先，global.css 次之：layer 顺序由引入顺序兜底
import './styles/tailwind.css'
import './styles/global.css'
// 组件级样式同样在 global.css 之后，追加进已存在的 project 层
import './styles/magic-transform.css'
import './styles/parallax-pills.css'
import './styles/staggered-text.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
