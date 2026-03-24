const SubmissionHeader = () => {
  return (
    <>
      <div className="relative mb-6 h-[350px] w-full overflow-hidden">
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
            Winners Announced!
          </h1>
        </div>
      </div>
      <div className="px-2 text-center">
        <div className="mx-auto justify-center mt-4 max-w-4xl rounded-2xl ">
          <p className="text-2xl font-bold leading-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-yellow-300 sm:text-3xl">
            🏆Congratulations to the winners of Vision Mysuru 2050 - Ink Your
            Idea🏆
          </p>
          <p className="mt-4 text-sm px-2 leading-tight text-[var(--muted)] sm:text-base">
            The Grand Finale has concluded and we are proud to celebrate the
            teams whose ideas stood out for innovation, impact, and feasibility.
            Thank you to every participant, mentor, jury member, and partner who
            made this challenge meaningful.
          </p>
        </div>
      </div>
    </>
  );
};

export default SubmissionHeader;
