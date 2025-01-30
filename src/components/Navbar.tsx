"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faShieldAlt,
  faBrain,
  faSignInAlt,
  faUserPlus,
  faInfoCircle,
  faGears,
  faDashboard,
  faUserShield,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg h-16">
      <div className="container mx-auto h-full px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo and App Name */}
          <Link
            href="/"
            className="flex items-center text-xl font-bold text-white hover:text-yellow-200 transition duration-300"
          >
            <FontAwesomeIcon 
              icon={faDashboard} 
              className="w-5 h-5 mr-2" 
              style={{ maxWidth: '1.25rem' }} 
            />
            ZecoCenter
          </Link>

          {/* Links */}
          <ul className="flex gap-x-6 items-center">
            {/* Secure link */}
            <li>
              <Link
                href="/security"
                className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
              >
                <FontAwesomeIcon 
                  icon={faShieldAlt} 
                  className="w-4 h-4 mr-1" 
                  style={{ maxWidth: '1rem' }} 
                />
                Security
              </Link>
            </li>

            {/* Meditate link */}
            <li>
              <Link
                href="/meditate"
                className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className="w-4 h-4 mr-1" 
                  style={{ maxWidth: '1rem' }} 
                />
                Meditate
              </Link>
            </li>

            {/* Dynamic Links Based on Session */}
            {session ? (
              <>
                <li>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center hover:text-yellow-200 transition duration-300 text-white"
                  >
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="w-4 h-4" 
                      style={{ maxWidth: '1rem' }} 
                    />
                  </Link>
                </li>

                {session?.user?.isAdmin && (
                  <>
                    <li>
                      <Link
                        href="/admin/users"
                        className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
                      >
                        <FontAwesomeIcon 
                          icon={faUserShield} 
                          className="w-4 h-4 mr-1" 
                          style={{ maxWidth: '1rem' }} 
                        />
                        Admin
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/analytics"
                        className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
                      >
                        <FontAwesomeIcon 
                          icon={faChartLine} 
                          className="w-4 h-4 mr-1" 
                          style={{ maxWidth: '1rem' }} 
                        />
                        Analytics
                      </Link>
                    </li>
                  </>
                )}
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
                  >
                    <FontAwesomeIcon 
                      icon={faSignInAlt} 
                      className="w-4 h-4 mr-1" 
                      style={{ maxWidth: '1rem' }} 
                    />
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="flex items-center hover:text-yellow-200 transition duration-300 text-white text-base"
                  >
                    <FontAwesomeIcon 
                      icon={faUserPlus} 
                      className="w-4 h-4 mr-1" 
                      style={{ maxWidth: '1rem' }} 
                    />
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
