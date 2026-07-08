import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'

export function HeroContent() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <h1 className="font-display text-[72px] font-normal leading-[1.02] tracking-[-0.024em] sm:text-[110px] md:text-[160px] lg:text-[220px]">
        <span className="text-foreground">Power </span>
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}
        >
          AI
        </span>
      </h1>
      <p className="mt-[9px] max-w-md text-lg leading-8 text-hero-sub opacity-80">
        A personal lab for AI experiments,
        <br />
        notes, and everything in between.
      </p>
      <a
        href="/ai/"
        className={cn(buttonVariants({ variant: 'heroSecondary' }), 'mt-[25px] px-[29px] py-[24px]')}
      >
        Explore the AI Lab
      </a>
    </div>
  )
}
