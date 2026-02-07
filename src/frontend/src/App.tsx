import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import ThemedToaster from './components/ThemedToaster';
import AppErrorBoundary from './components/AppErrorBoundary';

// Import pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PreMeditationPage from './pages/PreMeditationPage';
import ProgressPage from './pages/ProgressPage';
import JournalPage from './pages/JournalPage';
import BookRecommendationsPage from './pages/BookRecommendationsPage';
import KnowledgePage from './pages/KnowledgePage';

// Create root route
const rootRoute = createRootRoute();

// Create routes
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const preMeditationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pre-meditation',
  component: PreMeditationPage,
});

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: ProgressPage,
});

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: JournalPage,
});

const booksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/books',
  component: BookRecommendationsPage,
});

const knowledgeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/knowledge',
  component: KnowledgePage,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  landingRoute,
  dashboardRoute,
  preMeditationRoute,
  progressRoute,
  journalRoute,
  booksRoute,
  knowledgeRoute,
]);

// Create router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <RouterProvider router={router} />
        <ThemedToaster />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
