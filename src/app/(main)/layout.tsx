"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Auth from "@/components/Auth/Auth";
import UserProfile from "@/components/UserProfile";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    // You can customize the onAuthSuccess if needed, or remove it.
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-indigo-100 dark:bg-gray-900">
      {/* The Header now only needs the onProfileClick prop! */}
      <Header onProfileClick={() => setShowProfile(true)} />

      <main className="flex-grow w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-8 container-mobile">
          {showProfile ? (
            <UserProfile onClose={() => setShowProfile(false)} />
          ) : (
            children // The content of your page.tsx files will be rendered here
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
