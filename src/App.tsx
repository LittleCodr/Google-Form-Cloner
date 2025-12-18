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
    </BrowserRouter>
  )
}

export default App
