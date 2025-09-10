import React from 'react';

export const metadata = {
  title: 'Privacy Policy - Convortex',
  description: 'Privacy Policy for Convortex Document Signing and Conversion',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Policy</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, upload documents, or contact us for support.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">3. Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@convortex.com</p>
        </section>
      </div>
    </div>
  );
}