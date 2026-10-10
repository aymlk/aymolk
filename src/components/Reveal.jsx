import { useInView } from '../hooks'

/**
 * 滚动揭示容器。默认渲染 div，可通过 as / className 复用既有样式类。
 * 保持自己为目标父级的直接子元素，以兼容 CSS 中的 nth-child 错峰延迟。
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  options,
  children,
  ...rest
}) {
  const defaultOptions = { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  const [ref, inView] = useInView(options || defaultOptions)

  return (
    <Tag
      ref={ref}
      className={['reveal', inView ? 'is-in' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
