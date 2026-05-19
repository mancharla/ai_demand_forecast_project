import React from "react";
import Navbar from "./Navbar";

function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="p-4 md:p-6 lg:ml-64 lg:pt-24">
        {children}
      </main>
    </div>
  );
}

export default PageLayout;