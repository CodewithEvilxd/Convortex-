import React from "react";
import Link from "next/link"; // Use Next.js Link for internal navigation

const Footer = () => {
  return (
    // The footer now sits at the bottom, not sticky.
    // The background color is slightly softer for better contrast.
    <footer className="bg-slate-100 dark:bg-gray-900/50 border-t border-slate-200 dark:border-gray-800/50 text-slate-600 dark:text-slate-400">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 gap-mobile">
          {/* Copyright Information */}
          <p className="text-xs sm:text-sm text-center sm:text-left text-responsive">
            &copy; {new Date().getFullYear()} Convortex. All Rights Reserved.
          </p>

          {/* Footer Links */}
          <nav className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 space-x-0 sm:space-x-4 md:space-x-6 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200 touch-target px-2 py-1 sm:px-0 sm:py-0"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200 touch-target px-2 py-1 sm:px-0 sm:py-0"
            >
              Terms of Service
            </Link>
            <Link
              href="/help"
              className="hover:text-slate-900 dark:hover:text-white transition-colors duration-200 touch-target px-2 py-1 sm:px-0 sm:py-0"
            >
              Help
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
