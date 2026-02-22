import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const section = SECTIONS[activeSection]
    const isActive = enabled && section && ACTIVE_IDS.includes(section.id)

    if (isActive && content && content[section.id]) {
      const isLeft = section.position.x < 0

      gsap.killTweensOf(el)
      gsap.killTweensOf(el.children)
      gsap.set(el, { display: 'flex' })

      // Container: float up into view
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, delay: 0.6, ease: 'power2.out' }
      )

      // Stagger children: title → desc → each list item
      const children = el.querySelectorAll('.water-title, .water-desc, .water-item')
      gsap.fromTo(children,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: 0.8,
          stagger: 0.08,
          ease: 'power2.out',
        }
      )
    } else {
      gsap.killTweensOf(el)
      gsap.killTweensOf(el.children)
      gsap.to(el, {
        y: 25,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none' },
      })
    }
  }, [activeSection, content, enabled])

  const section = SECTIONS[activeSection]
  const isActive = enabled && section && ACTIVE_IDS.includes(section.id)
  const data = isActive && content ? content[section.id] : null

  if (!data) return <div ref={containerRef} className="water-text" style={{ display: 'none' }} />

  return (
    <div ref={containerRef} className="water-text" style={{ display: 'none', textAlign: 'center', alignItems: 'center' }}>
      <h2 className="water-title">{data.title}</h2>
      <p className="water-desc">{data.description}</p>
      {data.list.map((item, i) => (
        <span key={i} className="water-item">{item}</span>
      ))}
    </div>
  )
}
