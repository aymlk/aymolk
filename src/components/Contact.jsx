import Reveal from './Reveal'
import { profile } from '../data/site'

/** 5. 整屏底部联系区 */
export default function Contact() {
  const noop = (event) => event.preventDefault()

  return (
    <section className="contact" id="contact">
      <div className="container contact__inner">
        <Reveal as="p" className="eyebrow">
          <span className="eyebrow__dot" />
          取得联系 / GET IN TOUCH
        </Reveal>

        <Reveal as="h2" className="contact__title">
          一起，
          <br />
          把想法做成作品。
        </Reveal>

        <a href={`mailto:${profile.email}`} className="contact__mail">
          {profile.email}
        </a>

        <div className="contact__links">
          <a href={profile.phoneHref}>电话</a>
          <a href="#!" onClick={noop}>
            微信 · {profile.wechat}
          </a>
          <a href="#!" onClick={noop}>
            作品集 PDF
          </a>
        </div>

        <a href={`mailto:${profile.email}`} className="btn btn--solid contact__cta">
          写封邮件给我<span className="btn__arrow">→</span>
        </a>
      </div>

      <footer className="contact__foot container">
        <span>© 2026 {profile.name} · {profile.latin.toUpperCase()}</span>
        <span>Designed with voltage &amp; contrast.</span>
      </footer>
    </section>
  )
}
