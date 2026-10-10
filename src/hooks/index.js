import { useEffect, useRef, useState } from 'react'

/**
 * 顶部滚动状态：进度比例 + 是否已滚动（导航毛玻璃阈值）
 * 用 rAF 节流，避免每帧多次 setState。
 */
export function useScrollState() {
  const [state, setState] = useState({ ratio: 0, scrolled: false })

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const doc = document.documentElement
      const scrolled = doc.scrollTop
      const max = doc.scrollHeight - doc.clientHeight
      setState({
        ratio: max > 0 ? Math.min(Math.max(scrolled / max, 0), 1) : 0,
        scrolled: scrolled > 40,
      })
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    measure()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return state
}

/**
 * 元素进入视口检测。返回 [ref, inView]。
 *
 * @param {object} options
 *   - 其余项透传给 IntersectionObserver（threshold / rootMargin ...）
 *   - {boolean} [once=true] 命中一次后是否停止观察。
 *     默认 true 以保持历史语义（useCountUp 等依赖一次性触发）；
 *     React Bits 的 viewportOptions.once 默认 false，需要「离开视口即复位」时显式传 false。
 */
export function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const { once = true, ...ioOptions } = options
  const key = JSON.stringify(ioOptions)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            // once=false：离开视口即复位，让入场动效可以反复播放
            setInView(false)
          }
        })
      },
      JSON.parse(key)
    )

    io.observe(el)
    return () => io.disconnect()
  }, [key, once])

  return [ref, inView]
}

/**
 * 数字递增动画。进入视口（threshold 0.6）后开始，返回当前显示文本。
 */
export function useCountUp(target = 0, suffix = '', duration = 1400) {
  const [ref, inView] = useInView({ threshold: 0.6 })
  const [text, setText] = useState(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return `${target}${suffix}`
    }
    return `0${suffix}`
  })

  useEffect(() => {
    if (!inView) return

    let frame = 0
    let start = null

    const step = (ts) => {
      if (start === null) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setText(`${Math.round(target * eased)}${suffix}`)
      if (p < 1) frame = requestAnimationFrame(step)
      else setText(`${target}${suffix}`)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [inView, target, suffix, duration])

  return [ref, text]
}

/**
 * 是否开启「减少动态效果」。用于让动画组件降级为静态排版。
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * 观测元素宽度（ResizeObserver）。用于按容器宽度决定渲染密度。
 */
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof ResizeObserver === 'undefined') {
      setWidth(el.getBoundingClientRect().width)
      return
    }

    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const w = entry.contentRect?.width ?? entry.target.getBoundingClientRect().width
        setWidth(w)
      })
    })

    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [ref])

  return width
}
