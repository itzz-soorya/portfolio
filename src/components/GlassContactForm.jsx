import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

const CONTACT_INDEX = SECTIONS.findIndex(s => s.id === 'contact')

/**
 * FloatingContactForm — no glass panel.
 * Form fields float in the water with minimal transparent styling.
 */
export default function GlassContactForm({ activeSection, enabled }) {
  const formRef = useRef()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isActive = enabled && activeSection === CONTACT_INDEX

  useEffect(() => {
    const el = formRef.current
    if (!el) return

    if (isActive) {
      gsap.killTweensOf(el)
      gsap.killTweensOf(el.children)
      gsap.set(el, { display: 'flex' })

      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, delay: 0.6, ease: 'power2.out' }
      )

      const children = el.querySelectorAll('.water-title, .water-desc, .water-input, .water-submit, .water-form-success')
      gsap.fromTo(children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.8, stagger: 0.08, ease: 'power2.out' }
      )
    } else {
      gsap.killTweensOf(el)
      gsap.to(el, {
        y: 25,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none' },
      })
      setSubmitted(false)
    }
  }, [isActive])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Contact Form Submitted:', { name, email, message })
    setSubmitted(true)
    setName(''); setEmail(''); setMessage('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  // Contact is RIGHT side → text on left
  return (
    <div ref={formRef} className="water-text" style={{ display: 'none', alignItems: 'center', textAlign: 'center' }}>
      <h2 className="water-title">Get In Touch</h2>
      <p className="water-desc">Have a project idea or want to connect? Drop a message below.</p>

      {submitted ? (
        <div className="water-form-success">
          <span className="water-success-icon">✓</span>
          <p>Message sent successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="water-form">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="water-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="water-input"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="water-input water-textarea"
          />
          <button type="submit" className="water-submit">
            Send Message
          </button>
        </form>
      )}
    </div>
  )
}
