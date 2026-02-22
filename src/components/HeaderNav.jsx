import { SECTIONS } from '../config/SectionPositions'

export default function HeaderNav({ activeSection, onNavigate, visible }) {
  return (
    <header className={`header-nav ${visible ? 'header-visible' : ''}`}>
      <nav className="header-nav-inner">
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            onClick={() => onNavigate(i)}
            className={`header-nav-item ${activeSection === i ? 'active' : ''}`}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
