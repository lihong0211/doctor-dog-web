import { useEffect, useState, type CSSProperties } from 'react'
import { Github, Menu, X } from 'lucide-react'

import { Logo } from '@/components/Logo'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'AI', href: '/ai/' },
  { label: 'En', href: '/en/' },
]

const GITHUB_URL = 'https://github.com/lihong0211'

function GithubButton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      style={style}
      className={`flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white ${className}`}
    >
      GitHub
      <Github className="h-4 w-4" />
    </a>
  )
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    if (mobileMenuOpen) setMenuVisible(true)
  }, [mobileMenuOpen])

  const openMenu = () => setMobileMenuOpen(true)

  const closeMenu = () => {
    setMenuVisible(false)
    setTimeout(() => setMobileMenuOpen(false), 500)
  }

  return (
    <>
      <nav className="flex flex-row items-center justify-between px-6 py-5 md:px-12 lg:px-16">
        <a href="/" className="flex items-center gap-2" aria-label="doctor-dog Home">
          <Logo />
          <span className="text-xl font-bold tracking-wider text-white">doctor-dog</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-white/80 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <GithubButton className="hidden lg:flex" />

        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={mobileMenuOpen ? closeMenu : openMenu}
          className="relative z-[60] h-8 w-8 lg:hidden"
        >
          <Menu
            className={`absolute inset-0 h-8 w-8 text-white transition-all duration-300 ${
              mobileMenuOpen ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <X
            className={`absolute inset-0 h-8 w-8 text-white transition-all duration-300 ${
              mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'
            }`}
          />
        </button>
      </nav>

      {mobileMenuOpen && (
        <>
          <div
            onClick={closeMenu}
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-[400ms] ${
              menuVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="absolute left-0 right-0 top-[68px] z-50">
            <div className="absolute inset-0 rounded-b-2xl backdrop-blur-xl" />
            <div className="relative z-10 flex flex-col items-center gap-6 py-10">
              {NAV_LINKS.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-lg font-light tracking-[0.08em] text-white/80 transition-all duration-[400ms] ease-out hover:text-white sm:text-xl"
                  style={{
                    transitionDelay: menuVisible ? `${350 + index * 50}ms` : '0ms',
                    opacity: menuVisible ? 1 : 0,
                    transform: menuVisible ? 'translateY(0)' : 'translateY(12px)',
                  }}
                >
                  {link.label}
                </a>
              ))}
              <GithubButton
                className="transition-all duration-[400ms] ease-out"
                style={{
                  transitionDelay: menuVisible ? `${350 + NAV_LINKS.length * 50}ms` : '0ms',
                  opacity: menuVisible ? 1 : 0,
                  transform: menuVisible ? 'translateY(0)' : 'translateY(12px)',
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
