import Reveal from './Reveal'
import MagicTransform from './blocks/magic-transform'
import { works, workResults } from '../data/site'

/**
 * 3. 精选项目 —— Magic Transform
 * 左侧项目文档匀速流向右移 → 抵达中轴被绞碎 → 右侧吐出该项目的交付结果。
 * 与 works / workResults 按序一一对应（同长度）。
 */
const documents = works.map((work) => ({
  id: work.id,
  index: work.id,
  category: work.category,
  title: work.title,
  meta: work.year,
}))

export default function Work() {
  return (
    <section className="section work" id="work">
      <div className="container">
        <div className="section__head">
          <span className="section__index">02</span>
          <span className="section__label">精选项目 / SELECTED WORK</span>
        </div>

        <Reveal as="h2" className="section__title">
          在真实场景里，
          <br />
          把能力锻造成作品。
        </Reveal>

        <Reveal>
          <MagicTransform
            documents={documents}
            results={workResults}
            height={560}
            documentDuration={4}
            documentWidth={220}
            documentHeight={320}
            documentGap={60}
            particleCount={18}
            centerSize={56}
          />
        </Reveal>

        {/* 舞台本身是纯装饰（aria-hidden），这里给屏读用户一份等价清单 */}
        <ul className="magic-sr">
          {works.map((work, i) => (
            <li key={work.id}>
              {work.id}｜{work.category}｜{work.title}（{work.year}）。
              {workResults[i] ? `${workResults[i].label}：${workResults[i].body}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
