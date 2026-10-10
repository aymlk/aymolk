import Reveal from './Reveal'
import BlurHighlight from './BlurHighlight'
import CountUp from './CountUp'
import { bioParagraphs, contactItems, profile, stats } from '../data/site'

/** 2. 个人经历 */
export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="section__head">
          <span className="section__index">01</span>
          <span className="section__label">个人经历 / PROFILE</span>
        </div>

        <div className="about__grid">
          <Reveal className="about__media">
            <div className="portrait">
              {/* 替换为真实照片：<img src="/portrait.jpg" alt="金浩" /> */}
              <div className="portrait__placeholder">
                <span className="portrait__char">{profile.name.charAt(0)}</span>
                <span className="portrait__sub">{profile.latin.toUpperCase()}</span>
              </div>
              <span className="portrait__tag">{profile.school}</span>
            </div>
          </Reveal>

          <div className="about__body">
            <Reveal as="h2" className="about__title">
              兼具信息安全素养与
              <br />
              影像创作力的复合型人才
            </Reveal>

            <Reveal className="about__bio">
              {/* props 与 React Bits Pro · blur-highlight 官方规格一致；
                  highlightColor 显式锁死绯红，避免官方默认黄绿破坏严格双色 */}
              <BlurHighlight
                highlightedBits={['现场工程师班', '特等奖学金', '“人工智能+”专项赛']}
                highlightColor="var(--accent)"
              >
                {bioParagraphs[0]}
              </BlurHighlight>
              <BlurHighlight
                highlightedBits={['广汽 S7', 'Premiere / 剪映剪辑', '穿越机（FPV）']}
                highlightColor="var(--accent)"
                highlightDelay={0.55}
              >
                {bioParagraphs[1]}
              </BlurHighlight>
            </Reveal>

            <Reveal as="ul" className="about__contact">
              {contactItems.map((item) => (
                <li key={item.key}>
                  <span className="about__contact-k">{item.key}</span>
                  {item.href ? (
                    <a href={item.href}>{item.value}</a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </li>
              ))}
            </Reveal>

            <Reveal className="stats">
              {stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <CountUp count={stat.count} suffix={stat.suffix || ''} />
                  <span className="stat__label">{stat.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
