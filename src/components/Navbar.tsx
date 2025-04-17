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
  faVideo,
  faTasks,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  // Function to close the mobile menu
  const handleNavLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-md border-b border-[#84B9EF]/20 sticky top-0 z-50">
      <div className="container mx-auto h-16 px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo and App Name */}
          <Link
            href="/"
            onClick={handleNavLinkClick}
            className="flex items-center text-xl font-semibold text-[#0A2342] hover:text-[#2C4A7F] transition-colors duration-300"
          >
            <FontAwesomeIcon 
              icon={faDashboard} 
              className="w-5 h-5 mr-2 text-[#2C4A7F] hover:text-[#0A2342]" 
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
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className={`w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300`} 
                />
                <span className="font-medium">Meditate</span>
              </Link>
            </li>
            
            <li>
              <Link
                href="/videos"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
              >
                <FontAwesomeIcon 
                  icon={faVideo} 
                  className={`w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300`} 
                />
                <span className="font-medium">Videos</span>
              </Link>
            </li>

            <li>
              <Link
                href="/tasks/taskboard"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
              >
                <FontAwesomeIcon 
                  icon={faTasks} 
                  className={`w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300`} 
                />
                <span className="font-medium">Taskboard</span>
              </Link>
            </li>
            
            <li>
              <Link
                href="/remote-browser"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group py-1"
              >
                <FontAwesomeIcon 
                  icon={faGlobe} 
                  className={`w-4 h-4 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300`} 
                />
                <span className="font-medium">Remote Browser</span>
              </Link>
            </li>

            {session ? (
              <>
                {session?.user?.isAdmin && (
                  <>
                    <li>
                      <Link
                        href="/admin/users"
                        onClick={handleNavLinkClick}
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
                        onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
      <div className={`fixed inset-0 bg-white transition-transform transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} duration-300 ease-in-out`} style={{ top: '0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #E0E0E0', borderRadius: '20px 20px 0 0', background: 'linear-gradient(to bottom, #f0f4f8, #e0e7ef)' }}>
        <div className="flex flex-col items-center pt-4">
          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-4 right-4 text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>

          {/* Navigation Links */}
          <ul className="flex flex-col items-center space-y-4 pb-4">
            <li>
              <Link
                href="/meditate"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
              >
                <FontAwesomeIcon 
                  icon={faBrain} 
                  className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Meditate</span>
              </Link>
            </li>
            
            <li>
              <Link
                href="/videos"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
              >
                <FontAwesomeIcon 
                  icon={faVideo} 
                  className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Videos</span>
              </Link>
            </li>

            <li>
              <Link
                href="/tasks/taskboard"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
              >
                <FontAwesomeIcon 
                  icon={faTasks} 
                  className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Taskboard</span>
              </Link>
            </li>
            
            <li>
              <Link
                href="/remote-browser"
                onClick={handleNavLinkClick}
                className="flex items-center text-[#0A2342] hover:text-[#2C4A7F] transition-all duration-300 group"
              >
                <FontAwesomeIcon 
                  icon={faGlobe} 
                  className="w-6 h-6 mr-2 text-[#2C4A7F] group-hover:text-[#84B9EF] transition-colors duration-300" 
                />
                <span className="font-medium">Remote Browser</span>
              </Link>
            </li>

            {session ? (
              <>
                {session?.user?.isAdmin && (
                  <>
                    <li>
                      <Link
                        href="/admin/users"
                        onClick={handleNavLinkClick}
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
                        onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
                    onClick={handleNavLinkClick}
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
