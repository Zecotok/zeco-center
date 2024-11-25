import Link from "next/link";
import { getServerSession } from "next-auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShieldAlt, faBrain, faSignInAlt, faUserPlus, faInfoCircle, faGears, faDashboard } from "@fortawesome/free-solid-svg-icons";

async function Navbar() {
  const session = await getServerSession();

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center text-2xl font-bold text-white hover:text-yellow-200 transition duration-300">
          <FontAwesomeIcon icon={faDashboard} className="mr-2" />
          ZecoCenter
        </Link>

        {/* Links */}
        <ul className="flex gap-x-6 items-center text-white text-lg font-semibold">
          
          {/* Secure link */}
          <li>
            <Link href="/security" className="hover:text-yellow-200 transition duration-300 text-white">
              <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
              Security
            </Link>
          </li>

          {/* Meditate link */}
          <li>
            <Link href="/meditate" className="hover:text-yellow-200 transition duration-300 text-white">
              <FontAwesomeIcon icon={faBrain} className="mr-1" />
              Meditate
            </Link>
          </li>

          {/* Profile/User link */}
          {session ? (
            <li>
              <Link href="/dashboard/profile" className="hover:text-yellow-200 transition duration-300 text-white">
                <FontAwesomeIcon icon={faUser} />
              </Link>
            </li>
          ) : (
            <>
              {/* About link */}
              <li>
                <Link href="/about" className="hover:text-yellow-200 transition duration-300">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                  About
                </Link>
              </li>

              {/* Login link */}
              <li>
                <Link href="/login" className="hover:text-yellow-200 transition duration-300">
                  <FontAwesomeIcon icon={faSignInAlt} className="mr-1" />
                  Login
                </Link>
              </li>

              {/* Register link */}
              <li>
                <Link href="/register" className="hover:text-yellow-200 transition duration-300">
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
