import { Logo } from './Logo'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'En', href: '/en/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'AI', href: '/ai/' },
]

export function Navbar() {
  return (
    <div>
      <nav className="flex flex-row items-center justify-between px-8 py-5">
        <a href="/" aria-label="Home">
          <Logo />
        </a>
        <div className="flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-foreground/90 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="https://github.com/lihong0211"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: 'heroSecondary' }), 'rounded-full px-4 py-2')}
        >
          GitHub
        </a>
      </nav>
      <div className="mt-[3px] h-px w-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
    </div>
  )
}
