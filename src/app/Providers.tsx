"use client"
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";

interface Props {
    children: React.ReactNode
}

function Providers({ children }: Props ) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}

export default Providers