import { useEffect, useMemo, useRef } from 'react'
import { useInView, usePrefersReducedMotion } from '../hooks'

/**
 * Staggered Text
 * 规格对齐 React Bits Pro · staggered-text-tw（19 个 props 与官方同名同义）。
 * 文档：https://pro.reactbits.dev/docs/components/staggered-text
 *
 * 把 text 按 chars / words / lines 切段，滚入视口后逐段错峰入场
 * （位移方向 direction + 模糊 blur + 逐段 delay），支持三种 staggerDirection、
 * from/to 覆盖默认动画状态（to 支持关键帧数组）、离场动画 exitOnScrollOut。
 *
 * 实现说明（与官方的唯一差别是运行时）：
 *   官方基于 Motion（framer-motion）驱动；本项目未引入 motion 依赖，
 *   用 Web Animations API（element.animate）等价实现，关键帧 / 逐段错峰 /
 *   逐关键帧 easing 的语义保持一致。默认动画状态对齐官方默认值：
 *   direction="top"、blur=true、delay=80ms、duration=0.6s、线性 easing。
 *
 * 拿到 REACTBITS_LICENSE_KEY 后执行
 *   npx shadcn@latest add @reactbits-starter/staggered-text-tw
 * 即可用官方组件原地替换本文件，调用方无需改动（props 形状一致）。
 */

/* ---------- Motion easing 名 → CSS cubic-bezier ---------- */
const EASING_MAP = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  circIn: 'cubic-bezier(0.55, 0, 1, 0.45)',
  circOut: 'cubic-bezier(0, 0.55, 0.45, 1)',
  circInOut: 'cubic-bezier(0.85, 0, 0.15, 1)',
  backIn: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  backInOut: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  // anticipate：先反向蓄力再冲出，用 backIn 形近似
  anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
}

/** 把 easing prop（字符串名 / cubic-bezier 数组 / 函数）解析成 CSS easing 值 */
function resolveEasing(easing) {
  if (typeof easing === 'string') return EASING_MAP[easing] || 'linear'
  if (Array.isArray(easing) && easing.length === 4) return `cubic-bezier(${easing.join(', ')})`
  return 'linear' // 函数型 easing 无法下发给 CSS，回落线性（已注释说明）
}

/** 把 Motion 风格样式（x/y/scale/rotate/opacity/filter）转成 CSS 状态对象 */
function motionToCss(style) {
  if (!style) return null
  const t = []
  if (style.x != null) t.push(`translateX(${typeof style.x === 'number' ? `${style.x}px` : style.x})`)
  if (style.y != null) t.push(`translateY(${typeof style.y === 'number' ? `${style.y}px` : style.y})`)
  if (style.scale != null) t.push(`scale(${style.scale})`)
  if (style.rotate != null) t.push(`rotate(${typeof style.rotate === 'number' ? `${style.rotate}deg` : style.rotate})`)
  const out = {}
  if (style.opacity != null) out.opacity = style.opacity
  if (style.filter != null) out.filter = style.filter
  out.transform = t.length ? t.join(' ') : 'none'
  return out
}

const DIRECTIONS = ['top', 'bottom', 'left', 'right']
const STAGGERS = ['forward', 'reverse', 'center']
const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span']

/** direction → 默认初始位移（em 相对字号，随 hero__name 等大字自适应） */
const DIR_OFFSET = {
  top: { y: '0.9em' },
  bottom: { y: '-0.9em' },
  left: { x: '-0.9em' },
  right: { x: '0.9em' },
}

/** staggerDirection → 第 i 段的错峰倍数（乘以 delay 得到该段延迟） */
function staggerStep(i, n, staggerDirection) {
  if (staggerDirection === 'reverse') return n - 1 - i
  if (staggerDirection === 'center') return Math.abs(i - (n - 1) / 2)
  return i
}

/**
 * 切段：separator 先按行切，再按 segmentBy 细分。
 * 返回 rows: string[][]（行 → 段文本），词间空格由渲染层补文本节点。
 */
function buildRows(text, segmentBy, separator) {
  const rows = separator ? String(text).split(separator) : [String(text)]
  return rows.map((row) => {
    if (segmentBy === 'chars') return Array.from(row)
    if (segmentBy === 'lines') return [row]
    return row.split(/\s+/).filter(Boolean) // words：按空白切，丢弃连续空白
  })
}

export default function StaggeredText({
  text = '',
  className = '',
  as = 'p',
  segmentBy = 'words',
  separator,
  delay = 80,
  duration = 0.6,
  easing,
  threshold = 0.1,
  rootMargin = '0px',
  direction = 'top',
  blur = true,
  staggerDirection = 'forward',
  respectReducedMotion = true,
  exitOnScrollOut = false,
  from,
  to,
  onAnimationComplete,
  onExitComplete,
}) {
  const Tag = TAGS.includes(as) ? as : 'p'
  const dir = DIRECTIONS.includes(direction) ? direction : 'top'
  const stagger = STAGGERS.includes(staggerDirection) ? staggerDirection : 'forward'

  const containerRef = useRef(null)
  const segRefs = useRef([])
  const animsRef = useRef([])
  const doneRef = useRef(false)

  const [containerRef2, inView] = useInView({ threshold, rootMargin, once: !exitOnScrollOut })
  const reduced = usePrefersReducedMotion()
  const isStatic = respectReducedMotion && reduced

  const rows = useMemo(() => buildRows(text, segmentBy, separator), [text, segmentBy, separator])
  const segments = rows.flat()
  const multiRow = rows.length > 1

  // 合并回调 ref：同时持有 IntersectionObserver 目标与容器。
  // 注意 useInView 返回的是 **ref 对象**（useRef），不是回调式 ref，
  // 所以这里是赋值 .current 而不是把它当函数调用（写成 containerRef2(el) 会整站崩在 Hero）。
  const setContainerRef = (el) => {
    containerRef.current = el
    containerRef2.current = el
  }

  /* ---------- 关键帧构建（enter / exit 共用） ---------- */
  const keyframes = useMemo(() => {
    const offset = DIR_OFFSET[dir]
    const baseFrom = {
      opacity: 0,
      ...motionToCss(offset),
      ...(blur ? { filter: 'blur(10px)' } : {}),
    }
    const baseTo = {
      opacity: 1,
      transform: 'none',
      ...(blur ? { filter: 'blur(0px)' } : {}),
    }

    const fromState = { ...baseFrom, ...(motionToCss(from) || {}) }

    let frames
    if (Array.isArray(to)) {
      // to 为关键帧数组：[from, ...to 序列]，终态 = 最后一帧
      frames = [fromState, ...to.map((s) => ({ ...baseTo, ...(motionToCss(s) || {}) }))]
    } else if (to) {
      frames = [fromState, { ...baseTo, ...(motionToCss(to) || {}) }]
    } else {
      frames = [fromState, baseTo]
    }

    // easing 为数组时逐关键帧下发（作用于该帧到下一帧的区间）
    if (Array.isArray(easing) && Array.isArray(easing[0])) {
      frames = frames.map((f, i) => ({
        ...f,
        easing: resolveEasing(easing[Math.min(i, easing.length - 1)]),
      }))
    }

    const enter = frames
    const exit = [...frames].map((f) => ({ ...f })).reverse()
    return { enter, exit }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, blur, JSON.stringify(from), JSON.stringify(to), JSON.stringify(easing)])

  const cssEasing = useMemo(() => resolveEasing(easing), [easing])

  /* ---------- 播放 / 取消 ---------- */
  const cancelAll = () => {
    animsRef.current.forEach((a) => {
      try {
        a.cancel()
      } catch {
        /* 已结束的动画 cancel 无害 */
      }
    })
    animsRef.current = []
  }

  const play = (phase) => {
    cancelAll()
    const els = segRefs.current
    if (!els.length || typeof els[0].animate !== 'function') {
      const cb = phase === 'enter' ? onAnimationComplete : onExitComplete
      cb?.()
      return
    }
    const n = els.length
    const frames = phase === 'enter' ? keyframes.enter : keyframes.exit
    const anims = els.map((el, i) =>
      el.animate(frames, {
        duration: duration * 1000,
        delay: staggerStep(i, n, stagger) * delay,
        easing: cssEasing,
        fill: 'both',
      })
    )
    animsRef.current = anims

    const cb = phase === 'enter' ? onAnimationComplete : onExitComplete
    Promise.allSettled(anims.map((a) => a.finished)).then((results) => {
      // 期间被新一批动画替换（animsRef 已换血）则不触发回调
      if (animsRef.current !== anims) return
      if (results.every((r) => r.status === 'fulfilled')) cb?.()
    })
  }

  useEffect(() => {
    if (isStatic) {
      cancelAll()
      if (!doneRef.current) {
        doneRef.current = true
        onAnimationComplete?.()
      }
      return
    }
    if (inView) {
      play('enter')
      doneRef.current = true
    } else if (exitOnScrollOut && doneRef.current) {
      play('exit')
      doneRef.current = false
    }
    return cancelAll
    // rows 变化（text / segmentBy / separator）时重放，避免新分段卡在 CSS 初始隐藏态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, isStatic, rows])

  useEffect(() => cancelAll, []) // 卸载兜底

  let segIndex = 0
  const cls = [
    'staggered-text',
    multiRow ? 'staggered-text--multirow' : '',
    isStatic ? 'staggered-text--static' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag ref={setContainerRef} className={cls} aria-label={String(text)}>
      {rows.map((row, r) => (
        <span className="staggered-text__row" key={r} aria-hidden="true">
          {row.map((seg, i) => {
            const idx = segIndex++
            const isLast = i === row.length - 1
            return (
              <span key={i}>
                <span
                  className="staggered-text__seg"
                  ref={(el) => {
                    segRefs.current[idx] = el
                  }}
                >
                  {seg}
                </span>
                {!isLast ? ' ' : null}
              </span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
}
