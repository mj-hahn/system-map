import { createRoot } from 'react-dom/client'
import App from '../src/App'
import Panel from '../src/Panel'

const query = new URLSearchParams(location.search)
if (query.get('theme') === 'dark') document.documentElement.classList.add('dark')
// Starts in a System Map theme, as if the person had picked it. Like a pick, it stays.
const look = query.get('look')
try {
  if (look) localStorage.setItem('system-map.theme', look)
} catch {
  // Blocked storage: the page starts in Kiro Crew's colours.
}

createRoot(document.getElementById('root')!).render(
  query.get('view') === 'panel' ? (
    <div style={{ width: 420, height: '100vh', borderRight: '1px solid var(--border)' }}>
      <Panel />
    </div>
  ) : (
    <App />
  ),
)
