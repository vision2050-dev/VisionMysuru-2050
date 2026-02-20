import React from "react";

const SubmissionHeader = () => {
  return (
    <div className="relative mb-8 h-[400px] w-full overflow-hidden">
      <img
        src="https://res.cloudinary.com/dqlqxcwqr/image/upload/v1771551663/sdmclg_hqeqab.jpg"
        alt="Submit Idea"
        className="absolute inset-0 h-full w-full object-cover"
        lazyload="eager"
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to bottom, var(--bg) 0%, transparent 35%, transparent 65%, var(--bg) 100%)
          `,
        }}
      />

      <div className="relative z-10 flex h-full items-start justify-center pt-20">
        <h1 className="oswald text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Submit Your Idea
        </h1>
      </div>
    </div>
  );
};

export default SubmissionHeader;
