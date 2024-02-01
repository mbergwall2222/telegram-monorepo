import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full px-8 sm:px-16 md:px-24 pt-8 h-full">{children}</div>
  );
}
