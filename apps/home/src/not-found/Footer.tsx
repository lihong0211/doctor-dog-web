import { Github } from 'lucide-react'

const FOOTER_COLUMNS = [
  {
    title: 'EXPLORE',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'AI Lab', href: '/ai/' },
      { label: 'En', href: '/en/' },
    ],
  },
  {
    title: 'BLOG',
    links: [
      { label: 'Algorithm', href: '/blog/ALGORITHM/README' },
      { label: 'AI', href: '/blog/AI/home/README' },
      { label: 'Backend', href: '/blog/BACKEND/index' },
    ],
  },
]

const GITHUB_URL = 'https://github.com/lihong0211'

export function Footer() {
  return (
    <footer className="relative z-10 px-4 pb-8 pt-10 sm:px-6 sm:pb-10 md:px-12 lg:px-16 lg:pt-16">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 text-[10px] font-bold tracking-[0.15em] text-white sm:mb-4 sm:text-xs">
              {column.title}
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[10px] text-white/50 transition-colors duration-200 hover:text-white/80 sm:text-xs"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="col-span-2 sm:col-span-1">
          <h3 className="mb-3 text-[10px] font-bold tracking-[0.15em] text-white sm:mb-4 sm:text-xs">
            CONNECT
          </h3>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white"
          >
            <Github className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
