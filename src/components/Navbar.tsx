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
  const { data: session } = useSession(); // Client-side session state

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and App Name */}
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-white hover:text-yellow-200 transition duration-300"
        >
          <FontAwesomeIcon icon={faDashboard} className="mr-2" />
          ZecoCenter
        </Link>

        {/* Links */}
        <ul className="flex gap-x-6 items-center text-white text-lg font-semibold">
          {/* Secure link */}
          <li>
            <Link
              href="/security"
              className="hover:text-yellow-200 transition duration-300 text-white"
            >
              <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
              Security
            </Link>
          </li>

          {/* Meditate link */}
          <li>
            <Link
              href="/meditate"
              className="hover:text-yellow-200 transition duration-300 text-white"
            >
              <FontAwesomeIcon icon={faBrain} className="mr-1" />
              Meditate
            </Link>
          </li>

          {/* Dynamic Links Based on Session */}
          {session ? (
            <>
              <li>
                <Link
                  href="/dashboard/profile"
                  className="hover:text-yellow-200 transition duration-300 text-white"
                >
                  <FontAwesomeIcon icon={faUser} />
                </Link>
              </li>

              {session?.user?.isAdmin && (
                <>
                  <li>
                    <Link
                      href="/admin/users"
                      className="hover:text-yellow-200 transition duration-300 text-white"
                    >
                      <FontAwesomeIcon icon={faUserShield} className="mr-1" />
                      Admin
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/analytics"
                      className="hover:text-yellow-200 transition duration-300 text-white"
                    >
                      <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                      Analytics
                    </Link>
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              {/* Login link */}
              <li>
                <Link
                  href="/login"
                  className="hover:text-yellow-200 transition duration-300 text-white"
                >
                  <FontAwesomeIcon icon={faSignInAlt} className="mr-1" />
                  Login
                </Link>
              </li>

              {/* Register link */}
              <li>
                <Link
                  href="/register"
                  className="hover:text-yellow-200 transition duration-300 text-white"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
