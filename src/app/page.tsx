"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShieldAlt, faSpa, faChartLine } from "@fortawesome/free-solid-svg-icons";

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#EEF2F6] p-8">
      <h1 className="font-bold text-4xl mb-12 text-[#1a73e8] tracking-tight">
        Welcome to ZecoCenter
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Meditate Card */}
        <Link 
          href="/meditate" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#4285f4]/5 to-[#34a853]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/95 rounded-2xl p-8 h-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#e8f0fe] mb-4 group-hover:bg-[#d2e3fc] transition-colors duration-300">
                <FontAwesomeIcon 
                  icon={faSpa} 
                  className="w-8 h-8 text-[#1a73e8] group-hover:text-[#4285f4] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#202124] mb-2 group-hover:text-[#1a73e8] transition-colors duration-300">
                Meditate
              </h2>
              <p className="text-center text-[#5f6368] group-hover:text-[#202124] transition-colors duration-300">
                Relax and find inner peace.
              </p>
            </div>
          </div>
        </Link>
        
        {/* Analytics Card */}
        <Link 
          href="/admin/analytics" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#34a853]/5 to-[#fbbc04]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/95 rounded-2xl p-8 h-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#e6f4ea] mb-4 group-hover:bg-[#ceead6] transition-colors duration-300">
                <FontAwesomeIcon 
                  icon={faChartLine} 
                  className="w-8 h-8 text-[#34a853] group-hover:text-[#1e8e3e] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#202124] mb-2 group-hover:text-[#34a853] transition-colors duration-300">
                Analytics
              </h2>
              <p className="text-center text-[#5f6368] group-hover:text-[#202124] transition-colors duration-300">
                View meditation statistics.
              </p>
            </div>
          </div>
        </Link>

        {/* Profile Card */}
        <Link 
          href="/dashboard/profile" 
          className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 ease-out"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#ea4335]/5 to-[#fbbc04]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative bg-white/95 rounded-2xl p-8 h-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 rounded-xl bg-[#fce8e6] mb-4 group-hover:bg-[#fad2cf] transition-colors duration-300">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="w-8 h-8 text-[#ea4335] group-hover:text-[#d93025] transition-all duration-300 group-hover:scale-110"
                  style={{ maxWidth: '2rem' }} 
                />
              </div>
              <h2 className="font-semibold text-2xl text-[#202124] mb-2 group-hover:text-[#ea4335] transition-colors duration-300">
                Profile
              </h2>
              <p className="text-center text-[#5f6368] group-hover:text-[#202124] transition-colors duration-300">
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
