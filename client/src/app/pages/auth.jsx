"use client";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

function AuthPage() {
  const {data, status} = useSession();
  console.log(data, status)

  const signin = () => {
    console.log("Signing in Google");
    signIn("google");
  };

  const signout = () => {
    console.log("Signin out of Google");
    signOut();
  };

  return (
    <div className="m-10">
      <button
        type="submit"
        onClick={signin}
        className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        Sign In
      </button>
      <button
        type="submit"
        onClick={signout}
        className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      >
        Sign Out
      </button>
    </div>
  );
}

export default AuthPage;
