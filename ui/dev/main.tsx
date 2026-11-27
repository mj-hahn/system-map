import { createRoot } from 'react-dom/client'
import App from '../src/App'
import Panel from '../src/Panel'

const query = new URLSearchParams(location.search)
if (query.get('theme') === 'dark') document.documentElement.classList.add('dark')
// Starts in a System Map theme, as if the person had picked it.
const look = query.get('look')
if (look) localStorage.setItem('system-map.theme', look)

createRoot(document.getElementById('root')!).render(
  query.get('view') === 'panel' ? (
    <div style={{ width: 420, height: '100vh', borderRight: '1px solid var(--border)' }}>
      <Panel />
    </div>
  ) : (
    <App />
  ),
)
