/**
 * Section coordinates — camera navigates to these positions.
 * LEFT  = negative x
 * RIGHT = positive x
 * Camera travels diagonally between sections.
 */
export const SECTIONS = [
  { id: 'introduction', label: 'Introduction', position: { x: -6,  y: 2, z: 0 } },
  { id: 'stacks',       label: 'Stacks',       position: { x:  6,  y: 2, z: -20 } },
  { id: 'projects',     label: 'Projects',     position: { x: -6,  y: 2, z: -40 } },
  { id: 'github',       label: 'Github',       position: { x:  6,  y: 2, z: -60 } },
  { id: 'social',       label: 'Social',       position: { x: -6,  y: 2, z: -80 } },
  { id: 'contact',      label: 'Contact',      position: { x:  6,  y: 2, z: -100 } },
]
