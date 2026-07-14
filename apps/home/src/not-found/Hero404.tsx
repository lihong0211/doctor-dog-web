export function Hero404() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16 md:py-0">
      <h1 className="mb-1 text-lg font-light leading-snug tracking-tight text-white/80 xs:text-2xl sm:mb-2 sm:text-3xl md:text-5xl">
        This page seems to have
      </h1>
      <h1 className="mb-8 text-lg font-light leading-snug tracking-tight text-white/80 xs:text-2xl sm:mb-12 sm:text-3xl md:text-5xl">
        slipped beyond our reach :/
      </h1>

      <div className="relative mb-8 flex w-full justify-center overflow-visible sm:mb-12">
        <span className="four-oh-four select-none text-[80px] font-black leading-none tracking-tighter text-white xs:text-[100px] sm:text-[140px] md:text-[200px] lg:text-[260px]">
          404
        </span>
      </div>

      <a
        href="/"
        className="liquid-glass rounded-full px-6 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white xs:text-xs sm:px-8 sm:py-3.5 sm:text-sm sm:tracking-[0.2em]"
      >
        Return to Main Page
      </a>
    </div>
  )
}
