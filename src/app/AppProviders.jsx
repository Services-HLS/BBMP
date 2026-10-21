import { AuthProvider } from '../context/AuthContext';
import { AppThemeProvider } from '../context/ThemeContext';
import { AppDataProvider } from '../context/AppDataContext';
import { NotificationProvider } from '../context/NotificationContext';
import ErrorBoundary from '../components/ErrorBoundary';
import SplashIntro from '../components/splash/SplashIntro';

export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            <NotificationProvider>
              <SplashIntro>{children}</SplashIntro>
            </NotificationProvider>
          </AppDataProvider>
        </AuthProvider>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}
