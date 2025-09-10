"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

interface FormData {
  email: string;
  password: string;
  fullName: string;
  ConfirmPassword: string;
}

interface SignUpFormProps {
  onToggleForm: () => void;
  onAuthSuccess: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleForm }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    password: "",
    ConfirmPassword: "",
    email: "",
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
      if (!formData.email || !formData.fullName || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      if (formData.password !== formData.ConfirmPassword) {
        throw new Error("Password do not match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 character long");
      }

      //sign up the user
      await signUp(formData.email, formData.fullName, formData.password);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "SignUp failed , please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-lg shadow-lg max-w-md w-full mx-auto bg-blue-100 ">
      <h2 className="text-2xl font-bold mb-6 text-center text-black">
        Create Account
      </h2>

      {error && (
        <div
          className="mb-4 p-3 text-sm rounded-md bg-red-400 
        text-white"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium mb-1 text-black"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white rounded-md focus:outline-[#1a1b60]  focus:ring-2 text-[#1a1b60]"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2 text-black"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md focus:outline-[#1a1b60]focus:ring-2 bg-white text-[#1a1b60]"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1 text-black"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-white focus:outline-[#1a1b60] focus:ring-2 text-[#1a1b60]"
            required
          />
          <p className="mt-1 text-xs text-red-400 font-serif">
            ! Password must be at least 6 characters long
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="ConfirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="ConfirmPassword"
            name="ConfirmPassword"
            value={formData.ConfirmPassword}
            onChange={handleChange}
            className="bg-white w-full px-3 py-2 rounded-md focus:outline-[#1a1b60] focus:ring-2 text-[#1a1b60]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-md transition-colors"
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
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-amber-400 font-semibold">
          Already have an account ?
        </span>
        <button
          onClick={onToggleForm}
          className="font-medium transition-colors underline text-[#1a1b60]"
          onMouseEnter={e => {
            e.currentTarget.style.color = "#06923E";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#1a1b60";
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default SignUpForm;
