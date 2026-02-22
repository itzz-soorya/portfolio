import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

// Contact section index
const CONTACT_INDEX = SECTIONS.findIndex(s => s.id === 'contact')

/**
 * GlassContactForm — glass-styled form panel for the Contact section.
 * Rises from the ground like the content box.
 * Fields: Name, Email, Message. Submit → console.log.
 */
export default function GlassContactForm({ activeSection, enabled }) {
  const formRef = useRef()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isActive = enabled && activeSection === CONTACT_INDEX

  // Animate in/out — ground rise
  useEffect(() => {
    const el = formRef.current
    if (!el) return

    if (isActive) {
      // Position: contact is right-side (x:6) → box on left
      el.style.left = '6%'
      el.style.right = 'auto'

      gsap.killTweensOf(el)
      gsap.set(el, { display: 'block' })

      gsap.fromTo(el,
        {
          y: '80vh',
          opacity: 0,
          scale: 0.85,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.3,
          delay: 0.6,
          ease: 'power3.out',
        }
      )
    } else {
      gsap.killTweensOf(el)
      gsap.to(el, {
        y: '60vh',
        opacity: 0,
        scale: 0.9,
        duration: 0.7,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none' },
      })
      // Reset submitted state when leaving
      setSubmitted(false)
    }
  }, [isActive])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { name, email, message }
    console.log('Contact Form Submitted:', data)
    setSubmitted(true)
    // Clear form
    setName('')
    setEmail('')
    setMessage('')
    // Reset after 3s
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div ref={formRef} className="glass-box glass-form" style={{ display: 'none' }}>
      <h2 className="glass-box-title">Get In Touch</h2>
      <p className="glass-box-desc">
        Have a project idea or want to connect? Drop a message below.
      </p>

      {submitted ? (
        <div className="glass-form-success">
          <span className="glass-form-success-icon">✓</span>
          <p>Message sent successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-form-fields">
          <div className="glass-form-group">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="glass-input"
            />
          </div>
          <div className="glass-form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input"
            />
          </div>
          <div className="glass-form-group">
            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="glass-input glass-textarea"
            />
          </div>
          <button type="submit" className="glass-submit">
            Send Message
          </button>
        </form>
      )}
    </div>
  )
}
