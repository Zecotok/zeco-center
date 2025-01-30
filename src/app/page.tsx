"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShieldAlt, faSpa } from "@fortawesome/free-solid-svg-icons";

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
      <h1 className="font-bold text-4xl mb-8 text-gray-800">Welcome to ZecoCenter</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Meditate Card */}
        <Link href="/meditate" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg p-6 flex flex-col items-center transition-all duration-300 transform hover:scale-105">
          <FontAwesomeIcon 
            icon={faSpa} 
            className="w-8 h-8 mb-4"
            style={{ maxWidth: '2rem' }} 
          />
          <h2 className="font-semibold text-2xl">Meditate</h2>
          <p className="mt-2 text-center">Relax and find inner peace.</p>
        </Link>
        
        {/* Security Card */}
        <Link href="/security" className="bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg p-6 flex flex-col items-center transition-all duration-300 transform hover:scale-105">
          <FontAwesomeIcon 
            icon={faShieldAlt} 
            className="w-8 h-8 mb-4"
            style={{ maxWidth: '2rem' }} 
          />
          <h2 className="font-semibold text-2xl">Security</h2>
          <p className="mt-2 text-center">Manage your security settings.</p>
        </Link>
        
        {/* Profile Card */}
        <Link href="/dashboard/profile" className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg p-6 flex flex-col items-center transition-all duration-300 transform hover:scale-105">
          <FontAwesomeIcon 
            icon={faUser} 
            className="w-8 h-8 mb-4"
            style={{ maxWidth: '2rem' }} 
          />
          <h2 className="font-semibold text-2xl">Profile</h2>
          <p className="mt-2 text-center">View and edit your profile.</p>
        </Link>
      </div>

      {/* Logout Button */}
      <button
        className="mt-10 bg-red-500 hover:bg-red-600 text-white rounded-lg px-6 py-3 font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
        onClick={() => signOut()}
      >
        Logout
      </button>
    </div>
  );
}

export default HomePage;
