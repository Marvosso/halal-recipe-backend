import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "../pages/HomePage";
import SharePage from "../pages/SharePage";
import MyHalalRecipesPage from "../pages/MyHalalRecipesPage";
import IsItHalalPage from "../pages/IsItHalalPage";
import HalalSubstitutesPage from "../pages/HalalSubstitutesPage";
import HowItWorksPage from "../pages/HowItWorksPage";
import AboutPage from "../pages/AboutPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import TermsOfUsePage from "../pages/TermsOfUsePage";
import ContactPage from "../pages/ContactPage";
import AppWrapper from "./AppWrapper";
import SEOFooter from "./SEOFooter";

const IsIngredientHalalPage = lazy(() => import("../pages/IsIngredientHalalPage"));

const SEOPageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
      fontSize: "1.125rem",
      color: "var(--text-secondary)",
    }}
  >
    Loading...
  </div>
);

function AppRouter() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><HomePage /><SEOFooter /></>} />
          <Route path="/is-it-halal" element={<><IsItHalalPage /><SEOFooter /></>} />
          <Route path="/halal-substitutes" element={<><HalalSubstitutesPage /><SEOFooter /></>} />
          <Route path="/how-it-works" element={<><HowItWorksPage /><SEOFooter /></>} />
          <Route path="/about" element={<><AboutPage /><SEOFooter /></>} />
          <Route path="/privacy" element={<><PrivacyPolicyPage /><SEOFooter /></>} />
          <Route path="/terms" element={<><TermsOfUsePage /><SEOFooter /></>} />
          <Route path="/contact" element={<><ContactPage /><SEOFooter /></>} />
          <Route path="/my-halal-recipes" element={<><MyHalalRecipesPage /><SEOFooter /></>} />
          <Route path="/share" element={<SharePage />} />

          {/* Config-driven ingredient SEO pages (top 25) */}
          <Route
            path="/is-:slug-halal"
            element={
              <Suspense fallback={<SEOPageLoader />}>
                <IsIngredientHalalPage />
                <SEOFooter />
              </Suspense>
            }
          />

          <Route path="/app" element={<AppWrapper />} />
          <Route path="/convert" element={<AppWrapper />} />
          <Route path="/feed" element={<Navigate to="/app" replace />} />
          <Route path="/profile" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default AppRouter;
