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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-8 w-full max-w-md border border-[#84B9EF]/20"
      >
        {error && (
          <div className="bg-red-100/80 text-red-700 px-4 py-2 rounded-xl mb-4">
            {error}
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-[#0A2342] mb-6 text-center">
          Create an Account
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          name="fullname"
          className="bg-[#F0F7FF] border border-[#84B9EF]/20 rounded-xl px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#2C4A7F] focus:border-transparent"
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          name="email"
          className="bg-[#F0F7FF] border border-[#84B9EF]/20 rounded-xl px-4 py-2 block mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#2C4A7F] focus:border-transparent"
          pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
          title="Please enter a valid email address"
          required
        />

        <input
          type="password"
          placeholder="Password"
          name="password"
          className="bg-[#F0F7FF] border border-[#84B9EF]/20 rounded-xl px-4 py-2 block mb-6 w-full focus:outline-none focus:ring-2 focus:ring-[#2C4A7F] focus:border-transparent"
          required
        />

        <button
          type="submit"
          className="bg-[#2C4A7F] text-white font-bold rounded-xl px-4 py-2 w-full hover:bg-[#0A2342] transition duration-300"
        >
          Create Account
        </button>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-[#2C4A7F] hover:text-[#0A2342] font-medium">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
