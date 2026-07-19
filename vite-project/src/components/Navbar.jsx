import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Today\'s Words', emoji: '🌟' },
  { to: '/ai-words', label: 'AI Words', emoji: '🤖' },
  { to: '/verb-forms', label: 'Verb Forms', emoji: '📝' },
  { to: '/saved-verb-forms', label: 'Saved Verbs', emoji: '📖' },
  { to: '/my-vocab', label: 'My Vocabulary', emoji: '📚' },
]

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex', gap: '4px', padding: '12px 24px',
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}
          style={({ isActive }) => ({
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            fontSize: '14px', fontWeight: 600,
            background: isActive ? '#7c3aed' : 'transparent',
            color: isActive ? '#fff' : '#555',
            transition: 'all 0.15s'
          })}>
          {l.emoji} {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
