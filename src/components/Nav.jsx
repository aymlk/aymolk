import { navLinks, profile } from '../data/site'

/** 固定导航栏 */
export default function Nav({ scrolled }) {
  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`} id="nav">
      <div className="container nav__inner">
        <a href="#home" className="nav__logo" aria-label={`${profile.name} 首页`}>
          <span className="nav__logo-mark">{profile.name.charAt(0)}</span>
          <span className="nav__logo-text">
            {profile.latin.toUpperCase()}
            <em>/ portfolio</em>
          </span>
        </a>
        <nav className="nav__links" aria-label="主导航">
          {navLinks.map((link) => (
            <a href={link.href} className="nav__link" key={link.href}>
              {link.label}
              <span>{link.index}</span>
            </a>
          ))}
        </nav>
        <a href="#contact" className="btn btn--ghost nav__cta">
          联系我<span className="btn__dot" />
        </a>
      </div>
    </header>
  )
}
