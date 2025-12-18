import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminFormResponsesPage } from './pages/AdminFormResponsesPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { PublicFormPage } from './pages/PublicFormPage'
import { PublicHomePage } from './pages/PublicHomePage'

function NotFoundPage() {
  return (
    <div className="page">
      <p className="message message--error">पृष्ठ नहीं मिला।</p>
      <Link className="button" to="/">
        मुख्य पृष्ठ पर जाएँ
      </Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/form/:formId" element={<PublicFormPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/form/:formId" element={<AdminFormResponsesPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <footer className="site-footer">
          <p className="site-footer__text">
            Made with <span className="site-footer__heart" aria-hidden="true">❤️</span> by Balkishan Agrawal{' '}
            <a className="site-footer__link" href="https://mayank1406.pro" target="_blank" rel="noreferrer">
              &lt;mayank1406.pro&gt;
            </a>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
