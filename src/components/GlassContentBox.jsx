import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

/**
 * Sections that show the glass content box.
 * Github excluded (separate link), Contact excluded (separate form).
 */
const ACTIVE_IDS = ['introduction', 'stacks', 'projects', 'social']

/**
 * GlassContentBox — HTML overlay that rises from the ground (bottom of screen)
 * when a section activates. Content from portfolioContent.json.
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

  // Animate box in/out — GROUND RISE
  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    const section = SECTIONS[activeSection]
    const isActive = enabled && section && ACTIVE_IDS.includes(section.id)

    if (isActive && content && content[section.id]) {
      // Position based on section side
      const isLeft = section.position.x < 0
      el.style.left = isLeft ? 'auto' : '6%'
      el.style.right = isLeft ? '6%' : 'auto'

      // Rise from ground (bottom of viewport)
      gsap.killTweensOf(el)
      gsap.set(el, { display: 'block' })

      gsap.fromTo(el,
        {
          y: '80vh',    // start below viewport (ground level)
          opacity: 0,
          scale: 0.85,
        },
        {
          y: 0,         // rise to center position (CSS top: 50%)
          opacity: 1,
          scale: 1,
          duration: 1.3,
          delay: 0.6,
          ease: 'power3.out',
        }
      )
    } else {
      // Sink back into ground
      gsap.killTweensOf(el)
      gsap.to(el, {
        y: '60vh',
        opacity: 0,
        scale: 0.9,
        duration: 0.7,
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
