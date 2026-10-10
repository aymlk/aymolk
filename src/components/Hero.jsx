import { useEffect, useRef, useState } from 'react'
import ParticleCanvas from './ParticleCanvas'
import StaggeredText from './StaggeredText'
import { profile, heroMeta } from '../data/site'

/**
 * 1. 全屏首页：视频背景 + 粒子兜底 + 巨型字标 + 手写签名
 */
export default function Hero() {
  const heroRef = useRef(null)
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (video.readyState >= 3) setVideoReady(true)

    const activate = () => setVideoReady(true)
    video.addEventListener('canplay', activate, { once: true })
    video.addEventListener('loadeddata', activate, { once: true })

    // 播放被浏览器拦截时静默失败，保留粒子背景
    const promise = video.play?.()
    if (promise && promise.catch) promise.catch(() => {})

    return () => {
      video.removeEventListener('canplay', activate)
      video.removeEventListener('loadeddata', activate)
    }
  }, [])

  return (
    <section
      className={`hero${videoReady ? ' has-video' : ''}`}
      id="home"
      ref={heroRef}
    >
      <div className="hero__glow" aria-hidden="true" />
      <video
        className={`hero__video${videoReady ? ' is-ready' : ''}`}
        ref={videoRef}
        src="./hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <ParticleCanvas />
      <div className="hero__mask" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__aside hero-anim" style={{ '--d': '0ms' }}>
          <p className="eyebrow">
            <span className="eyebrow__dot" />
            {profile.role}
          </p>
          <p className="hero__lead">
            {profile.lead[0]}
            <br />
            {profile.lead[1]}
          </p>
          <div className="hero__actions">
            <a href="#work" className="btn btn--solid">
              查看精选项目<span className="btn__arrow">→</span>
            </a>
            <a href="#contact" className="btn btn--ghost">
              取得联系
            </a>
          </div>
        </div>

        <div className="hero__lockup hero-anim" style={{ '--d': '180ms' }}>
          <span className="hero__kicker">Portfolio</span>
          {/* staggered-text-tw 等效实现：官方默认配置（direction=top / blur / 80ms / 0.6s）。
              中文姓名无空格，须按 chars 切段才有错峰；其余 props 全部走官方默认值 */}
          <StaggeredText as="h1" className="hero__name" text={profile.name} segmentBy="chars" />
          <span className="hero__script" aria-hidden="true">
            {profile.latin}
          </span>
        </div>
      </div>

      <div className="hero__meta container hero-anim" style={{ '--d': '360ms' }}>
        {heroMeta.map((item) => (
          <span className="hero__meta-item" key={item}>
            {item}
          </span>
        ))}
        <a href="#about" className="hero__scroll">
          向下滚动 <span className="hero__scroll-line" />
        </a>
      </div>

      <span className="hero__sidetag" aria-hidden="true">
        PORTFOLIO — © 2026
      </span>
    </section>
  )
}
