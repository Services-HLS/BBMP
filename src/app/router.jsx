import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import ScrollToTop from '../components/common/ScrollToTop';
import LoginPage from '../pages/LoginPage';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import NotFoundPage from '../pages/NotFoundPage';
import HomeRedirect from './HomeRedirect';
import { ROLES } from '../constants';

import DashboardPage from '../pages/DashboardPage';
import VehiclesPage from '../pages/VehiclesPage';
import WardSimulationPage from '../pages/WardSimulationPage';
import WardHouseCollectionPage from '../pages/WardHouseCollectionPage';
import RoutesPage from '../pages/RoutesPage';
import CoveragePage from '../pages/CoveragePage';
import DryWasteCentresPage from '../pages/DryWasteCentresPage';
import ComplaintsPage from '../pages/ComplaintsPage';
import SweepingPage from '../pages/SweepingPage';
import DashcamPage from '../pages/DashcamPage';
import FeedbackPage from '../pages/FeedbackPage';
import ScorecardsPage from '../pages/ScorecardsPage';
import ReportsPage from '../pages/ReportsPage';
import AssistantPage from '../pages/AssistantPage';
import ImpactPage from '../pages/ImpactPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

import CitizenHomePage from '../pages/citizen/CitizenHomePage';
import TrackAutoPage from '../pages/citizen/TrackAutoPage';
import ReportProblemPage from '../pages/citizen/ReportProblemPage';
import MyReportsPage from '../pages/citizen/MyReportsPage';
import CollectionCalendarPage from '../pages/citizen/CollectionCalendarPage';
import TodaysPickupPage from '../pages/citizen/TodaysPickupPage';
import CitizenSettingsPage from '../pages/citizen/CitizenSettingsPage';

const ops = [ROLES.ADMIN, ROLES.SUPERVISOR];
const adminOnly = [ROLES.ADMIN];
const citizen = [ROLES.CITIZEN];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        <Route
          element={
            <ProtectedRoute roles={[...ops, ...citizen]}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/dashboard" element={<ProtectedRoute roles={ops}><DashboardPage /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute roles={ops}><VehiclesPage /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute roles={ops}><WardSimulationPage /></ProtectedRoute>} />
          <Route path="/ward-39" element={<ProtectedRoute roles={ops}><WardHouseCollectionPage /></ProtectedRoute>} />
          <Route path="/ward-57" element={<ProtectedRoute roles={ops}><WardHouseCollectionPage /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute roles={ops}><RoutesPage /></ProtectedRoute>} />
          <Route path="/coverage" element={<ProtectedRoute roles={ops}><CoveragePage /></ProtectedRoute>} />
          <Route path="/dry-waste-centres" element={<ProtectedRoute roles={ops}><DryWasteCentresPage /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute roles={ops}><ComplaintsPage /></ProtectedRoute>} />
          <Route path="/sweeping" element={<ProtectedRoute roles={ops}><SweepingPage /></ProtectedRoute>} />
          <Route path="/dashcam" element={<ProtectedRoute roles={ops}><DashcamPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute roles={ops}><FeedbackPage /></ProtectedRoute>} />
          <Route path="/scorecards" element={<ProtectedRoute roles={ops}><ScorecardsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={ops}><ReportsPage /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute roles={ops}><AssistantPage /></ProtectedRoute>} />
          <Route path="/impact" element={<ProtectedRoute roles={adminOnly}><ImpactPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={[...ops, ...citizen]}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={ops}><SettingsPage /></ProtectedRoute>} />

          <Route path="/citizen" element={<ProtectedRoute roles={citizen}><CitizenHomePage /></ProtectedRoute>} />
          <Route path="/citizen/track" element={<ProtectedRoute roles={citizen}><TrackAutoPage /></ProtectedRoute>} />
          <Route path="/citizen/report" element={<ProtectedRoute roles={citizen}><ReportProblemPage /></ProtectedRoute>} />
          <Route path="/citizen/reports" element={<ProtectedRoute roles={citizen}><MyReportsPage /></ProtectedRoute>} />
          <Route path="/citizen/calendar" element={<ProtectedRoute roles={citizen}><CollectionCalendarPage /></ProtectedRoute>} />
          <Route path="/citizen/pickup" element={<ProtectedRoute roles={citizen}><TodaysPickupPage /></ProtectedRoute>} />
          <Route path="/citizen/settings" element={<ProtectedRoute roles={citizen}><CitizenSettingsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
