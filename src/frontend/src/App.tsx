import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

// Import pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PreMeditationPage from './pages/PreMeditationPage';
import ProgressPage from './pages/ProgressPage';
import JournalPage from './pages/JournalPage';
import BookRecommendationsPage from './pages/BookRecommendationsPage';

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

// Create route tree
const routeTree = rootRoute.addChildren([
  landingRoute,
  dashboardRoute,
  preMeditationRoute,
  progressRoute,
  journalRoute,
  booksRoute,
]);

// Create router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <InternetIdentityProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </InternetIdentityProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

export default App;
