import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

/**
 * IDs that get the glass content box.
 * Github & Contact excluded — they'll have separate behavior.
 */
const ACTIVE_IDS = ['introduction', 'stacks', 'projects', 'social']

/**
 * GlassContentBox — HTML overlay that shows content when a section activates.
 * Loads content from /data/portfolioContent.json.
 * Animates: fade in from below with GSAP, slight floating motion.
 */
export default function GlassContentBox({ activeSection, enabled }) {
  const [content, setContent] = useState(null)
  const boxRef = useRef()
  const prevSection = useRef(-1)

  // Load JSON once
  useEffect(() => {
    fetch('/data/portfolioContent.json')
      .then(r => r.json())
      .then(setContent)
      .catch(() => {})
  }, [])

  // Animate box in/out
  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    const section = SECTIONS[activeSection]
    const isActive = enabled && section && ACTIVE_IDS.includes(section.id)

    if (isActive && content && content[section.id]) {
      // Animate in — slide up + fade in
      gsap.killTweensOf(el)
      // Position based on section side (left sections → right box, right → left box)
      const isLeft = section.position.x < 0
      el.style.left = isLeft ? 'auto' : '6%'
      el.style.right = isLeft ? '6%' : 'auto'

      gsap.fromTo(el,
        { y: 60, opacity: 0, scale: 0.92, display: 'block' },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          delay: 1.2,   // wait for bubble to rise first
          ease: 'power2.out',
        }
      )
    } else {
      // Animate out
      gsap.killTweensOf(el)
      gsap.to(el, {
        y: 40,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none' },
      })
    }

    prevSection.current = activeSection
  }, [activeSection, content, enabled])

  // Determine current content
  const section = SECTIONS[activeSection]
  const isActive = enabled && section && ACTIVE_IDS.includes(section.id)
  const data = isActive && content ? content[section.id] : null

  if (!data) return <div ref={boxRef} className="glass-box" style={{ display: 'none' }} />

  return (
    <div ref={boxRef} className="glass-box" style={{ display: 'none' }}>
      <h2 className="glass-box-title">{data.title}</h2>
      <p className="glass-box-desc">{data.description}</p>
      <ul className="glass-box-list">
        {data.list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
