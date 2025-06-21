"use client";
import { SessionProvider } from "next-auth/react";

import React from "react";

function SessionProviderAuth({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default SessionProviderAuth;
