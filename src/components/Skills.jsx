import { useState } from 'react'
import Reveal from './Reveal'
import CapabilityBlob from './CapabilityBlob'
import { capabilities } from '../data/site'

/** Radial Reveal：记录光标进入/点击点，填充以该点为圆心向外扩散 */
function setRevealOrigin(e) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--reveal-x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--reveal-y', `${e.clientY - rect.top}px`)
}

/** 逐字扫色文本（复刻 originkit · text-colour-sweep）：字符错峰升入，色带扫过后落色 */
function SweepText({ text }) {
  return (
    <span className="sweep" aria-hidden="true">
      {text.split('').map((ch, i) => (
        <span className="sweep__char" style={{ '--i': i }} key={`${ch}-${i}`}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

/** 4. 个人优势 —— Bento 网格（点击卡片：反差色填满 + 3 条优势逐字跳出） */
export default function Skills() {
  const [activeId, setActiveId] = useState(null)

  const toggleCard = (id) => setActiveId((prev) => (prev === id ? null : id))

  return (
    <section className="section skills" id="skills">
      <div className="container">
        <div className="section__head">
          <span className="section__index">03</span>
          <span className="section__label">个人优势 / CAPABILITIES</span>
        </div>

        <Reveal as="h2" className="section__title">
          跨界的训练，
          <br />
          带来更稳的执行力。
        </Reveal>

        <div className="bento">
          {capabilities.map((item) => {
            const active = activeId === item.id
            return (
              <Reveal
                as="article"
                className={`bento__card${item.wide ? ' bento__card--wide' : ''}${active ? ' bento__card--active' : ''}`}
                onPointerEnter={setRevealOrigin}
                onPointerDown={setRevealOrigin}
                onClick={() => toggleCard(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleCard(item.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={active}
                key={item.id}
              >
                <span className="bento__fill" aria-hidden="true" />

                {!item.wide && (
                  <div className="bento__top">
                    <span className="bento__chip">
                      {String(item.id).padStart(2, '0')}
                    </span>
                    <span className="bento__sys">SYSTEM</span>
                  </div>
                )}
                <h3 className="bento__title">
                  {item.title}
                  <i className="bento__dot" aria-hidden="true" />
                </h3>
                <p className="bento__desc">{item.desc}</p>

                <ul className="bento__points">
                  {item.points.map((point, li) => (
                    <li className="bento__point" style={{ '--li': li }} key={point} aria-label={point}>
                      <span className="bento__point-num" aria-hidden="true">
                        {String(li + 1).padStart(2, '0')}
                      </span>
                      <SweepText text={point} />
                    </li>
                  ))}
                </ul>

                <CapabilityBlob variant={item.blob} uid={`blob-${item.id}`} />
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
