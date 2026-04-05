import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/protected-route'
import { AuthProvider } from '@/lib/auth'
import { HomePage } from '@/pages/home-page'
import { HrPage } from '@/pages/hr-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PublicSharePage } from '@/pages/public-share-page'
import { PublicVerifyPage } from '@/pages/public-verify-page'
import { StudentPage } from '@/pages/student-page'
import { UnauthorizedPage } from '@/pages/unauthorized-page'
import { UniversityPage } from '@/pages/university-page'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/university"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'university_admin', 'university_operator']}>
                  <UniversityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPage />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/hr" element={<HrPage />} />
            <Route path="/public/verify/:verificationToken" element={<PublicVerifyPage />} />
            <Route path="/public/share/:shareToken" element={<PublicSharePage />} />
            <Route path="/v/:verificationToken" element={<PublicVerifyPage />} />
            <Route path="/s/:shareToken" element={<PublicSharePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
