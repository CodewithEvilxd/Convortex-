'use client'
import React, { useState } from 'react';
import SignInForm from '@/components/Auth/SignInForm';
import SignUpForm from '@/components/Auth/SignUpForm';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth:React.FC<AuthProps> = ({ onAuthSuccess })=> {
    const [showSignIn, setShowSignIn] = useState<boolean>(false);

    const toggleForm = ():void => {
        setShowSignIn(!showSignIn);
    };     

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Convortex
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              File Conversion & Signature Tool
            </p>
          </div>

          {showSignIn ? (
            <SignUpForm
              onToggleForm={toggleForm}
              onAuthSuccess={onAuthSuccess}
            />
          ) : (
            <SignInForm
              onToggleForm={toggleForm}
              onAuthSuccess={onAuthSuccess}
            />
          )}
        </div>
      </div>
    );
  };

export default Auth;