import React from "react";

const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-100 overflow-x-hidden">
    <div className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default Container;
