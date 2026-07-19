const btn = { padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', fontWeight: 600 }
const activeBtn = { ...btn, background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap' }}>
      <button onClick={() => onPageChange(1)} disabled={page === 1} style={{ ...btn, opacity: page === 1 ? 0.4 : 1 }}>First</button>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} style={{ ...btn, opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
      {start > 1 && <span style={{ color: '#999', fontSize: '13px' }}>...</span>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} style={p === page ? activeBtn : btn}>{p}</button>
      ))}
      {end < totalPages && <span style={{ color: '#999', fontSize: '13px' }}>...</span>}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} style={{ ...btn, opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
      <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} style={{ ...btn, opacity: page === totalPages ? 0.4 : 1 }}>Last</button>
    </div>
  )
}
