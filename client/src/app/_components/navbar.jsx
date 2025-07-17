import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function NavBar() {
  const router = useRouter();
  const { data } = useSession();

  const goToUpload = () => {
    router.push("/upload");
  };

  return (
    <div>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            VideoStore
          </span>
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            {data ? (
              <div className="flex">
                <button
                  type="button"
                  onClick={goToUpload}
                  className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center m-2"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center m-2"
                >
                  Sign Out
                </button>

                <span className="my-5">Hello {data.user.name}</span>
                <div className="m-3">
                  <img
                    class="w-10 h-10 rounded-full"
                    src={data.user.image}
                    alt=""
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={signIn}
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
