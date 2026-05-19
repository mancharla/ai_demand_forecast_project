import React from "react";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
    </div>
  );
}

export default SkeletonCard;