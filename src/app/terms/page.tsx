import React from 'react';

export const metadata = {
  title: 'Terms of Service - Convortex',
  description: 'Terms of Service for Convortex Document Signing and Conversion',
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Terms of Service</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using Convortex, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily use Convortex for personal, non-commercial transitory viewing only.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Service Availability</h2>
          <p>We strive to provide continuous service but do not guarantee that the service will be uninterrupted or error-free.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at legal@convortex.com</p>
        </section>
      </div>
    </div>
  );
}