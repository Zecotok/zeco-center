"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (response?.ok) {
        router.push("/");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-8 w-96 border border-[#84B9EF]/20"
      >
        {error && (
          <div className="bg-red-100/80 text-red-700 px-4 py-2 rounded-xl mb-4">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-[#0A2342] mb-6 text-center">
          Welcome Back
        </h1>

        <input
          type="email"
          placeholder="Email Address"
          name="email"
          className="bg-[#F0F7FF] border border-[#84B9EF]/20 rounded-xl px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#2C4A7F] focus:border-transparent"
          required
        />

        <input
          type="password"
          placeholder="Password"
          name="password"
          className="bg-[#F0F7FF] border border-[#84B9EF]/20 rounded-xl px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#2C4A7F] focus:border-transparent"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#2C4A7F] text-white font-bold rounded-xl px-4 py-2 w-full hover:bg-[#0A2342] transition duration-300 disabled:opacity-70 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Donot have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
