"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShieldAlt, faSpa } from "@fortawesome/free-solid-svg-icons";

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] p-8">
      <h1 className="font-bold text-4xl mb-12 text-[#0A2342] tracking-tight">
        Welcome to ZecoCenter
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Meditate Card */}
        <Link 
          href="/meditate" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C4A7F]/10 to-[#84B9EF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 h-full shadow-lg shadow-[#2C4A7F]/5
            transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#F0F7FF] mb-4 group-hover:bg-[#E6F0FF] transition-colors duration-300 shadow-sm">
                <FontAwesomeIcon 
                  icon={faSpa} 
                  className="w-8 h-8 text-[#2C4A7F] group-hover:text-[#0A2342] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#0A2342] mb-2 group-hover:text-[#2C4A7F] transition-colors duration-300">
                Meditate
              </h2>
              <p className="text-center text-[#2C4A7F] group-hover:text-[#0A2342] transition-colors duration-300">
                Relax and find inner peace.
              </p>
            </div>
          </div>
        </Link>
        
        {/* Security Card */}
        <Link 
          href="/security" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C4A7F]/10 to-[#84B9EF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 h-full shadow-lg shadow-[#2C4A7F]/5
            transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#F0F7FF] mb-4 group-hover:bg-[#E6F0FF] transition-colors duration-300 shadow-sm">
                <FontAwesomeIcon 
                  icon={faShieldAlt} 
                  className="w-8 h-8 text-[#2C4A7F] group-hover:text-[#0A2342] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#0A2342] mb-2 group-hover:text-[#2C4A7F] transition-colors duration-300">
                Security
              </h2>
              <p className="text-center text-[#2C4A7F] group-hover:text-[#0A2342] transition-colors duration-300">
                Manage your security settings.
              </p>
            </div>
          </div>
        </Link>

        {/* Profile Card */}
        <Link 
          href="/dashboard/profile" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2C4A7F]/10 to-[#84B9EF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 h-full shadow-lg shadow-[#2C4A7F]/5
            transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#F0F7FF] mb-4 group-hover:bg-[#E6F0FF] transition-colors duration-300 shadow-sm">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="w-8 h-8 text-[#2C4A7F] group-hover:text-[#0A2342] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#0A2342] mb-2 group-hover:text-[#2C4A7F] transition-colors duration-300">
                Profile
              </h2>
              <p className="text-center text-[#2C4A7F] group-hover:text-[#0A2342] transition-colors duration-300">
                View and manage your profile.
              </p>
            </div>
          </div>
        </Link>
      </div>


    </div>
  );
}

export default HomePage;
