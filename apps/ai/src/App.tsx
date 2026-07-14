import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import PortalPage from './pages/Portal'
import AppHub from './pages/AppHub'
import ExperienceCenter from './pages/ExperienceCenter'
import { experienceRoutes, skillsRoutes, appRoutes } from './config/routes'

function App() {
  return (
    <BrowserRouter basename="/ai">
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/hub" replace />} />
          <Route path="hub" element={<AppHub />} />
          <Route path="models" element={<ExperienceCenter />} />
          <Route path="experience">
            <Route index element={<Navigate to="/experience/llm" replace />} />
            {experienceRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Route>
          <Route path="skills">
            <Route index element={<Navigate to="/skills/vector-db" replace />} />
            {skillsRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Route>
          <Route path="apps">
            <Route index element={<Navigate to="/hub" replace />} />
            {appRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Route>
          <Route path="portal" element={<PortalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
