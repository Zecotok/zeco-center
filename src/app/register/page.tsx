"use client";

import axios, { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const fullname = formData.get("fullname");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const signupResponse = await axios.post("/api/auth/signup", {
        fullname,
        email,
        password,
      });

      console.log(signupResponse);

      const signinResponse = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signinResponse?.ok) return router.push("/dashboard/profile");

      console.log(signinResponse);
    } catch (error) {
      console.error(error);
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "An error occurred");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-96 border-t-4 border-blue-500"
      >
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-blue-500 mb-6 text-center">
          Create an Account
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          name="fullname"
          className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

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
          className="bg-blue-500 text-white font-bold rounded-lg px-4 py-2 w-full hover:bg-blue-500 transition duration-300"
        >
          Sign Up
        </button>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
