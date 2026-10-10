import { marqueeKeywords } from '../data/site'

/**
 * 关键词跑马灯
 * 轨道内容重复两遍，配合 CSS translateX(-50%) 实现无缝循环
 */
export default function Marquee() {
  const sequence = (prefix) =>
    marqueeKeywords.map((item, i) => (
      <span className={item.dot ? 'dot' : item.hot ? 'hot' : undefined} key={`${prefix}-${i}`}>
        {item.text}
      </span>
    ))

  return (
    <section className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {sequence('a')}
        {sequence('b')}
      </div>
    </section>
  )
}
