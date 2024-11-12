import Link from "next/link";
import { getServerSession } from "next-auth";

async function Navbar() {
  const session = await getServerSession();

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* App Name */}
        <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
          ZecoCenter
        </Link>

        {/* Links */}
        <ul className="flex gap-x-4 items-center">
          {session ? (
            <li>
              <Link
                href="/dashboard/profile"
                className="text-lg text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
              >
                Profile
              </Link>
            </li>
          ) : (
            <>
              <li>
                <Link
                  href="/about"
                  className="text-lg text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-lg text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-lg text-red-600 hover:text-red-700 font-semibold transition-colors duration-200"
                >
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
