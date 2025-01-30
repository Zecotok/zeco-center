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
    <nav className="bg-white shadow-md border-b border-[#84B9EF]/20 sticky top-0 z-50">
      <div className="container mx-auto h-16 px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo and App Name */}
          <Link
            href="/"
            className="flex items-center text-xl font-semibold text-[#0A2342] hover:text-[#2C4A7F] transition-colors duration-300"
          >
            <FontAwesomeIcon 
              icon={faDashboard} 
              className="w-5 h-5 mr-2 text-[#2C4A7F]" 
              style={{ maxWidth: '1.25rem' }} 
            />
            ZecoCenter
          </Link>

          {/* Navigation Links */}
          <ul className="flex items-center space-x-8">
            <li>
              <Link
                href="/security"
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
              >
                <FontAwesomeIcon 
                  icon={faShieldAlt} 
                  className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Security</span>
              </Link>
            </li>

            <li>
              <Link
                href="/meditate"
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Meditate</span>
              </Link>
            </li>

            {session ? (
              <>
                              {session?.user?.isAdmin && (
                  <>
                    <li>
                      <Link
                        href="/admin/users"
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
                      >
                        <FontAwesomeIcon 
                          icon={faUserShield} 
                          className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                        />
                        <span className="font-medium">Admin</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/analytics"
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
                      >
                        <FontAwesomeIcon 
                          icon={faChartLine} 
                          className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                        />
                        <span className="font-medium">Analytics</span>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
                  >
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="w-4 h-4 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                  </Link>
                </li>


              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
                  >
                    <FontAwesomeIcon 
                      icon={faSignInAlt} 
                      className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                    <span className="font-medium">Login</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-5"
                  >
                    <FontAwesomeIcon 
                      icon={faUserPlus} 
                      className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                    <span className="font-medium">Register</span>
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
