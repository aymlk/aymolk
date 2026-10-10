import { useInView } from '../hooks'

/** 转义正则特殊字符，保证关键词按字面匹配 */
const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const DIRECTIONS = ['left', 'right', 'top', 'bottom']

/**
 * 把 highlightedBits 切成文本段。
 * 支持两种形态（与官方一致）：
 *   - string            → 高亮该词的**所有**出现
 *   - { text, occurrence } → 只高亮第 occurrence 次出现（1-based）
 * 多词同时匹配时按长度降序排列分支，避免短词把长词吞掉
 * （如「剪映剪辑」与「剪辑」并存时，先匹配长词）。
 */
function buildSegments(text, bits) {
  const list = (bits || []).filter(Boolean)
  if (list.length === 0) return [{ text }]

  const norm = list.map((b) =>
    typeof b === 'string' ? { text: b, occurrence: null } : { text: b.text, occurrence: b.occurrence ?? null }
  )
  const needles = [...new Set(norm.map((n) => n.text))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  if (needles.length === 0) return [{ text }]

  const re = new RegExp(`(${needles.map(escapeReg).join('|')})`, 'g')
  const seen = new Map()
  const segments = []
  let last = 0

  for (const m of text.matchAll(re)) {
    const hit = m[0]
    const nth = (seen.get(hit) || 0) + 1
    seen.set(hit, nth)

    // 该次出现是否需要高亮：任一规则匹配即可
    const shouldHighlight = norm.some((n) => n.text === hit && (n.occurrence === null || n.occurrence === nth))
    if (!shouldHighlight) continue

    if (m.index > last) segments.push({ text: text.slice(last, m.index) })
    segments.push({ text: hit, highlight: true })
    last = m.index + hit.length
  }

  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

/**
 * Blur Highlight
 * 规格对齐 React Bits Pro · blur-highlight-tw（13 个 props 与官方同名同义）。
 *
 * 段落初始 blur + 低透明度，滚入视口后聚焦清晰；
 * highlightDelay 之后，命中的关键词按 highlightDirection 方向扫色高亮。
 *
 * ⚠️ 与官方的唯一差异（刻意为之）：
 *   官方 highlightColor 默认 "hsl(80, 100%, 50%)"（黄绿），违反本项目**严格双色**约定，
 *   故默认值改为 var(--accent)（绯红 #ff2d55）。传入该 prop 仍可覆盖。
 *
 * 拿到 REACTBITS_LICENSE_KEY 后执行
 *   npx shadcn@latest add @reactbits-starter/blur-highlight-tw
 * 即可用官方组件原地替换本文件，调用方无需改动（props 形状一致）。
 */
export default function BlurHighlight({
  children,
  highlightedBits = [],
  highlightColor = 'var(--accent)',
  highlightClassName = '',
  blurAmount = 8,
  inactiveOpacity = 0.3,
  blurDelay = 0,
  blurDuration = 0.8,
  highlightDelay = 0.4,
  highlightDuration = 1,
  highlightDirection = 'left',
  viewportOptions = { once: false, amount: 0.5 },
  className = '',
}) {
  // 官方：margin 固定 -20%，amount/once 由 viewportOptions 控制
  const { once = false, amount = 0.5 } = viewportOptions || {}
  const [ref, inView] = useInView({
    threshold: amount,
    rootMargin: '0px 0px -20% 0px',
    once,
  })

  const dir = DIRECTIONS.includes(highlightDirection) ? highlightDirection : 'left'
  const text = String(children ?? '')
  const segments = buildSegments(text, highlightedBits)

  // 数值型 props 走 CSS 变量下发，避免内联样式里散落动画硬编码
  const style = {
    '--bh-blur': `${blurAmount}px`,
    '--bh-inactive-opacity': inactiveOpacity,
    '--bh-blur-dur': `${blurDuration}s`,
    '--bh-blur-delay': `${blurDelay}s`,
    '--bh-hl-dur': `${highlightDuration}s`,
    '--bh-hl-delay': `${highlightDelay}s`,
    '--bh-hi': highlightColor,
  }

  const cls = [
    'blur-highlight',
    `blur-highlight--${dir}`,
    inView ? 'is-in' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <p ref={ref} className={cls} style={style}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            className={`blur-highlight__mark${highlightClassName ? ` ${highlightClassName}` : ''}`}
            key={i}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  )
}
