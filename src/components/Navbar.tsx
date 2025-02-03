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
  faTimes,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

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

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300"
          >
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Navigation Links */}
          <ul className={`flex-col md:flex md:flex-row ${isOpen ? 'flex bg-white border border-[#84B9EF]/20' : 'hidden'} md:flex items-center space-y-1 md:space-y-0 md:space-x-4`}>
            <li>
              <Link
                href="/meditate"
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className={`w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300`} 
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
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
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
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
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
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
                  >
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                    <span className="font-medium">Profile</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
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
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
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

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 bg-white transition-transform transform ${isOpen ? 'translate-y-0' : '-translate-y-full'} duration-300 ease-in-out`} style={{ height: '50vh', top: '0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #E0E0E0' }}>
        <div className="flex flex-col items-center pt-4">
          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-4 right-4 text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>

          {/* Navigation Links */}
          <ul className="flex flex-col items-center space-y-4">
            <li>
              <Link
                href="/meditate"
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
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
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
                      >
                        <FontAwesomeIcon 
                          icon={faUserShield} 
                          className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                        />
                        <span className="font-medium">Admin</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/analytics"
                        className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
                      >
                        <FontAwesomeIcon 
                          icon={faChartLine} 
                          className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                        />
                        <span className="font-medium">Analytics</span>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
                  >
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                    <span className="font-medium">Profile</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
                  >
                    <FontAwesomeIcon 
                      icon={faSignInAlt} 
                      className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                    />
                    <span className="font-medium">Login</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
                  >
                    <FontAwesomeIcon 
                      icon={faUserPlus} 
                      className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
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
