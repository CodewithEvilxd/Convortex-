"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

// defines Types
interface FormData {
  email: string;
  password: string;
}

interface SignInFormProps {
  onToggleForm: () => void;
  onAuthSuccess: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onToggleForm }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      //validate inputs
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      // Sign in the user
      await signIn(formData.email, formData.password);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Sign in failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-lg shadow-lg max-w-md w-full mx-auto bg-blue-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#1a1b60]">
        Welcome Back
      </h2>

      {/* Demo Account Info */}
      <div className="mb-4 p-3 text-sm rounded-md bg-blue-50 border border-blue-200">
        <p className="text-blue-800 font-medium mb-1">Demo Account:</p>
        <p className="text-blue-700 text-xs">Email: demo@convert.com</p>
        <p className="text-blue-700 text-xs">Password: demo123</p>
        <p className="text-blue-600 text-xs mt-1">Or create your own account!</p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm rounded-md bg-red-400 text-white">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2 text-[#1a1b60] "
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2  rounded-md focus:outline-[#1a1b60] focus:ring-2 bg-white text-[#1a1b60]"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2 text-[#1a1b60] "
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2  rounded-md focus:outline-[#1a1b60] focus:ring-2 bg-white text-[#1a1b60]"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-md transition-colors mb-4"
          style={{
            backgroundColor: isLoading ? "#06923E" : "#1a1b60",
            color: isLoading ? "#06923E" : "#ffffff",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#1a1b60";
            }
          }}
          onMouseLeave={e => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#1a1b60";
            }
          }}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="text-center text-sm ">
        <span className="text-amber-400 font-semibold">
          Don&apos;t have an account ?
        </span>
        <button
          type="button"
          onClick={onToggleForm}
          className="font-medium transition-colors text-[#1a1b60] underline"
          onMouseEnter={e => {
            e.currentTarget.style.color = "#06923E";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#1a1b60";
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default SignInForm;
