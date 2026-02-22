import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

const ACTIVE_IDS = ['introduction', 'stacks', 'projects', 'github', 'social']

/**
 * FloatingText — no box, no panel. Just text floating in water.
 * Fades in with upward float + glow. Fades out with downward drift.
 */
export default function GlassContentBox({ activeSection, enabled }) {
  const [content, setContent] = useState(null)
  const containerRef = useRef()

  useEffect(() => {
    fetch('/data/portfolioContent.json')
      .then(r => r.json())
      .then(setContent)
      .catch(() => {})
  }, [])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const section = SECTIONS[activeSection]
    const isActive = enabled && section && ACTIVE_IDS.includes(section.id)

    if (isActive && content && content[section.id]) {
      const isLeft = section.position.x < 0
      const sideX = isLeft ? -60 : 60

      gsap.killTweensOf(el)
      gsap.killTweensOf(el.children)
      gsap.set(el, { display: 'flex', opacity: 0 })

      // Container: emerge from ocean depth on the corresponding side
      gsap.fromTo(el,
        { z: -500, x: sideX, scale: 0.6, opacity: 0, transformPerspective: 900 },
        { z: 0, x: 0, scale: 1, opacity: 1, transformPerspective: 900, duration: 1.3, delay: 0.6, ease: 'power2.out' }
      )

      // Stagger children: each emerges from depth with slight offset
      const children = el.querySelectorAll('.water-title, .water-desc, .water-item')
      gsap.fromTo(children,
        { z: -200, x: sideX * 0.3, opacity: 0, transformPerspective: 900 },
        {
          z: 0,
          x: 0,
          opacity: 1,
          transformPerspective: 900,
          duration: 0.9,
          delay: 0.85,
          stagger: 0.09,
          ease: 'power2.out',
        }
      )
    } else {
      const prevSection = SECTIONS[activeSection]
      const wasLeft = prevSection ? prevSection.position.x < 0 : true
      const exitX = wasLeft ? -40 : 40

      gsap.killTweensOf(el)
      gsap.killTweensOf(el.children)
      gsap.to(el, {
        z: -300,
        x: exitX,
        scale: 0.75,
        opacity: 0,
        transformPerspective: 900,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none' },
      })
    }
  }, [activeSection, content, enabled])

  const section = SECTIONS[activeSection]
  const isActive = enabled && section && ACTIVE_IDS.includes(section.id)
  const data = isActive && content ? content[section.id] : null

  if (!data) return <div ref={containerRef} className="water-text" style={{ display: 'none', opacity: 0 }} />

  return (
    <div ref={containerRef} className="water-text" style={{ display: 'none', opacity: 0, textAlign: 'center', alignItems: 'center' }}>
      <h2 className="water-title">{data.title}</h2>
      <p className="water-desc">{data.description}</p>
      {data.list.map((item, i) => (
        <span key={i} className="water-item">{item}</span>
      ))}
    </div>
  )
}
