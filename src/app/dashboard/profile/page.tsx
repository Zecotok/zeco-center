"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faSignOutAlt, faPhone, faAddressCard } from "@fortawesome/free-solid-svg-icons";

function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>; // Optional loading state
  }

  const fullName = session?.user?.fullname || "Guest User";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F0FF] to-[#F0F7FF] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-[#2C4A7F]/10 p-8 border border-[#84B9EF]/20">
          <h1 className="text-3xl font-bold text-[#0A2342] text-center mb-6">
            Welcome, {firstName}
          </h1>
          
          <div className="space-y-4">
            {/* Profile Information */}
            <div className="flex items-center p-3 rounded-lg bg-[#F0F7FF]">
              <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-[#2C4A7F] mr-3" />
              <span className="text-[#0A2342]">{fullName}</span>
            </div>
            
            <div className="flex items-center p-3 rounded-lg bg-[#F0F7FF]">
              <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-[#2C4A7F] mr-3" />
              <span className="text-[#0A2342]">{session?.user?.email}</span>
            </div>
          </div>

          <button
            className="mt-8 w-full bg-[#2C4A7F] text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-[#0A2342] transition-colors duration-300 flex items-center justify-center"
            onClick={() => signOut()}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
