import { useCountUp } from '../hooks'

/** 滚动到视口后递增的数字 */
export default function CountUp({ count, suffix = '' }) {
  const [ref, text] = useCountUp(count, suffix)
  return (
    <span className="stat__num" ref={ref}>
      {text}
    </span>
  )
}
