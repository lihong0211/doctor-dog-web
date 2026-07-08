const LINKS = [
  { name: 'En', href: '/en/' },
  { name: 'Blog', href: '/blog/' },
  { name: 'AI', href: '/ai/' },
  { name: 'GitHub', href: 'https://github.com/lihong0211' },
]

const LOOPED_LINKS = [...LINKS, ...LINKS]

export function LogoMarquee() {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <div className="flex items-center gap-12">
        <p className="whitespace-nowrap text-sm text-foreground/50">
          Things I&apos;ve been
          <br />
          building lately
        </p>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee gap-16">
            {LOOPED_LINKS.map((link, index) => (
              <a
                key={`${link.name}-${index}`}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="liquid-glass flex h-6 w-6 items-center justify-center rounded-lg text-sm font-semibold">
                  {link.name[0]}
                </span>
                <span className="text-base font-semibold text-foreground">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
