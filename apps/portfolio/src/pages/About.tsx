import { AnimatedParagraph } from '../components/AnimatedParagraph'
import { CornerDecorations } from '../components/CornerDecorations'
import { FadeIn } from '../components/FadeIn'
import { GradientButton } from '../components/GradientButton'

const BIO_TEXT =
  "With more five years experience in design, i focus on branding, web design, user experience, i truly enjoy working businesses aim stand out present best image. Let's build something incredible together!"

export default function About() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-8 md:px-10">
      <CornerDecorations />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn
            as="h1"
            y={40}
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About me
          </FadeIn>
          <AnimatedParagraph
            text={BIO_TEXT}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
        </div>
        <FadeIn delay={0.3} y={20}>
          <GradientButton to="/contact">Contact Me</GradientButton>
        </FadeIn>
      </div>
    </section>
  )
}
