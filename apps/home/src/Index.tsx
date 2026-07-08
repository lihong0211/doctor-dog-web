import { BackgroundVideo } from './components/BackgroundVideo'
import { HeroContent } from './components/HeroContent'
import { LogoMarquee } from './components/LogoMarquee'
import { Navbar } from './components/Navbar'

export default function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackgroundVideo />
      <section className="relative z-10 flex min-h-screen flex-col overflow-visible">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[527px] w-[984px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-950 opacity-90 blur-[82px]" />
        <Navbar />
        <HeroContent />
        <LogoMarquee />
      </section>
    </div>
  )
}
