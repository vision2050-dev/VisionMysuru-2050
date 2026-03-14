import React from "react";

const SubmissionHeader = () => {
  return (
    <div className="relative mb-8 h-[350px] w-full overflow-hidden">
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

      <div className="relative z-10 flex h-full items-start justify-center pt-17">
        <h1 className="oswald text-3xl font-bold text-white text-center  md:text-5xl">
          Round 1 shortlist <br />
          announced!👇 <br />
        </h1>
      </div>
    </div>
  );
};

export default SubmissionHeader;
