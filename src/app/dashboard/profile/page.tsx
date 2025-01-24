"use client";

import { useSession, signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faSignOutAlt, faPhone, faAddressCard } from "@fortawesome/free-solid-svg-icons";

function ProfilePage() {
  const { data: session} = useSession();
  const fullName = session?.user?.fullname || "Guest User";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-blue-100 flex flex-col items-center p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 mt-10 text-center">
        <h1 className="text-4xl font-bold text-teal-800 mb-4">Hello, {firstName}!</h1>
        <p className="text-xl text-gray-700">Welcome to your profile page.</p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-lg shadow-md mt-6 p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-teal-200 flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faUser} className="text-teal-600 text-5xl" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">{fullName}</h2>
        <p className="text-gray-600 text-lg mb-4">@{session?.user?.username || "username"}</p>
        
        <div className="w-full mt-4 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faEnvelope} className="text-teal-500 text-xl" />
            <p className="text-lg text-gray-700">{session?.user?.email || "Not provided"}</p>
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faPhone} className="text-teal-500 text-xl" />
            <p className="text-lg text-gray-700">Phone: {session?.user?.phone || "Not provided"}</p>
          </div>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faAddressCard} className="text-teal-500 text-xl" />
            <p className="text-lg text-gray-700">Location: {session?.user?.location || "Not specified"}</p>
          </div>
        </div>
      </div>

      <button
        className="mt-8 bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-teal-600 transition-colors"
        onClick={() => signOut()}
      >
        <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
        Logout
      </button>
    </div>
  );
}

export default ProfilePage;
