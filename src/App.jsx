import ScrollProgress from './components/ScrollProgress'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Work from './components/Work'
import Skills from './components/Skills'
import Contact from './components/Contact'
import { useScrollState } from './hooks'

export default function App() {
  const { ratio, scrolled } = useScrollState()

  return (
    <>
      <ScrollProgress ratio={ratio} />
      <div className="grain" aria-hidden="true" />
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Work />
        <Skills />
        <Contact />
      </main>
    </>
  )
}
