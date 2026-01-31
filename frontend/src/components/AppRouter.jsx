import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "../pages/HomePage";
import IsItHalalPage from "../pages/IsItHalalPage";
import HalalSubstitutesPage from "../pages/HalalSubstitutesPage";
import HowItWorksPage from "../pages/HowItWorksPage";
import AboutPage from "../pages/AboutPage";
import AppWrapper from "./AppWrapper";
import SEOFooter from "./SEOFooter";

// Lazy load SEO ingredient pages
const IsGelatinHalalPage = lazy(() => import("../pages/IsGelatinHalalPage"));
const IsBaconHalalPage = lazy(() => import("../pages/IsBaconHalalPage"));
const IsVanillaExtractHalalPage = lazy(() => import("../pages/IsVanillaExtractHalalPage"));
const IsWineVinegarHalalPage = lazy(() => import("../pages/IsWineVinegarHalalPage"));

// Loading fallback for lazy-loaded components
const SEOPageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.125rem',
    color: 'var(--text-secondary)'
  }}>
    Loading...
  </div>
);

function AppRouter() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* SEO Landing Pages */}
          <Route path="/" element={<><HomePage /><SEOFooter /></>} />
          <Route path="/is-it-halal" element={<><IsItHalalPage /><SEOFooter /></>} />
          <Route path="/halal-substitutes" element={<><HalalSubstitutesPage /><SEOFooter /></>} />
          <Route path="/how-it-works" element={<><HowItWorksPage /><SEOFooter /></>} />
          <Route path="/about" element={<><AboutPage /><SEOFooter /></>} />
          
          {/* SEO Ingredient Pages - Lazy Loaded */}
          <Route 
            path="/is-gelatin-halal" 
            element={
              <Suspense fallback={<SEOPageLoader />}>
                <IsGelatinHalalPage />
                <SEOFooter />
              </Suspense>
            } 
          />
          <Route 
            path="/is-bacon-halal" 
            element={
              <Suspense fallback={<SEOPageLoader />}>
                <IsBaconHalalPage />
                <SEOFooter />
              </Suspense>
            } 
          />
          <Route 
            path="/is-vanilla-extract-halal" 
            element={
              <Suspense fallback={<SEOPageLoader />}>
                <IsVanillaExtractHalalPage />
                <SEOFooter />
              </Suspense>
            } 
          />
          <Route 
            path="/is-wine-vinegar-halal" 
            element={
              <Suspense fallback={<SEOPageLoader />}>
                <IsWineVinegarHalalPage />
                <SEOFooter />
              </Suspense>
            } 
          />
          
          {/* App Routes - Preserve existing behavior */}
          <Route path="/app" element={<AppWrapper />} />
          <Route path="/convert" element={<AppWrapper />} />
          
          {/* Redirect old routes to app */}
          <Route path="/feed" element={<Navigate to="/app" replace />} />
          <Route path="/profile" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default AppRouter;
