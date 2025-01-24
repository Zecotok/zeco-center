"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-96 border-t-4 border-blue-500"
      >
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-blue-600 mb-6 text-center">
          Welcome Back
        </h1>

        <input
          type="email"
          placeholder="Email Address"
          name="email"
          className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          placeholder="Password"
          name="password"
          className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white font-bold rounded-lg px-4 py-2 w-full hover:bg-blue-600 transition duration-300"
        >
          Login
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
