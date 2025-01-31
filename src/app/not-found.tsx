import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSadTear } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-600 to-teal-500 text-white">
      <div className="text-center">
        <FontAwesomeIcon icon={faSadTear} size="5x" className="mb-6 text-yellow-300" />
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">Oops! The page you are looking for doesnot exist.</p>
        
        <Link href="/" className="inline-block px-8 py-3 bg-yellow-300 text-blue-900 font-semibold rounded-full shadow-lg hover:bg-yellow-400 transition duration-300">
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
