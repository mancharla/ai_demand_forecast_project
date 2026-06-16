import React from "react";
import Navbar from "./Navbar";

function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      <main className="p-4 md:p-6 lg:ml-72 lg:pt-24">
        {children}
      </main>
    </div>
  );
}

export default PageLayout;