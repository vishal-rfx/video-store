import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function NavBar() {
  const router = useRouter();
  const { data } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const goToUpload = () => {
    router.push("/upload");
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    signIn();
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsMenuOpen(false);
  };

  return (
    <div>
      <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          {/* Logo */}
          <span
            className="self-center text-xl sm:text-2xl font-semibold whitespace-nowrap dark:text-white cursor-pointer"
            onClick={() => router.push("/")}
          >
            VideoStore
          </span>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>

          {/* Desktop menu */}
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            {data ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={goToUpload}
                  className="text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center transition-all duration-200 transform hover:scale-105"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center transition-all duration-200 transform hover:scale-105"
                >
                  Sign Out
                </button>

                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                    Hello, {data.user.name}
                  </span>
                  <img
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    src={data.user.image}
                    alt={data.user.name}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center transition-all duration-200 transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu */}
          <div
            className={`${isMenuOpen ? "block" : "hidden"} w-full md:hidden`}
            id="navbar-mobile"
          >
            <div className="flex flex-col space-y-4 pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {data ? (
                <>
                  <div className="flex items-center space-x-3 px-4">
                    <img
                      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                      src={data.user.image}
                      alt={data.user.name}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hello, {data.user.name}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-2 px-4">
                    <button
                      type="button"
                      onClick={goToUpload}
                      className="text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-4 py-3 text-center transition-all duration-200"
                    >
                      Upload Video
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-4 py-3 text-center transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="w-full text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-4 py-3 text-center transition-all duration-200"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
