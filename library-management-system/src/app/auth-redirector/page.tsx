"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/loading";

// Function to validate the redirect path
function isValidInternalPath(path: string | null): boolean {
  if (!path) return false;
  // Allow only relative paths within your application
  // and ensure it doesn't start with '//' which could be an external link
  return path.startsWith('/') && !path.startsWith('//');
}

function AuthRedirector() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  // Get the redirect destination from URL params if available
  const redirectTo = searchParams.get('redirectTo');

  useEffect(() => {
    if (authLoading) {
      // Wait for auth context to load
      return;
    }

    if (!user) {
      // If no user, redirect to login
      // Preserve redirectTo for after login, ensuring it's encoded
      const loginRedirectTo = redirectTo && isValidInternalPath(redirectTo) ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
      const loginUrl = `/login${loginRedirectTo}`;
      router.replace(loginUrl);
      return;
    }

    if (user && userRole) {
      setRedirecting(true);
      
      let targetUrl: string;

      if (redirectTo && isValidInternalPath(redirectTo)) {
        // User has a specific, valid internal redirect destination
        if (redirectTo.startsWith('/admin') && userRole !== 'admin') {
          // User trying to access admin but not admin, redirect to user dashboard
          targetUrl = "/dashboard";
        } else {
          targetUrl = redirectTo;
        }
      } else {
        // No valid redirectTo, or redirectTo is invalid/external, or not provided
        // Default redirect based on role
        if (userRole === "admin") {
          targetUrl = "/admin";
        } else {
          targetUrl = "/dashboard";
        }
      }
      router.replace(targetUrl);
    }
    // If user exists but userRole is not yet determined, keep showing loading
    // The AuthContext should handle this case and either provide a role or clear the user

  }, [user, userRole, authLoading, router, redirectTo]);

  // Show loading while auth is loading, user role is being determined, or while redirecting
  if (authLoading || (user && !userRole) || redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">
          {authLoading ? 'Loading...' : redirecting ? 'Redirecting...' : 'Setting up your account...'}
        </p>
      </div>
    );
  }
  // Fallback - should not normally reach here
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}

export default function AuthRedirectorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <AuthRedirector />
    </Suspense>
  );
}
