import { Link } from 'react-router-dom'

import { CornerDecorations } from '../components/CornerDecorations'
import { FadeIn } from '../components/FadeIn'
import { GradientButton } from '../components/GradientButton'

const CONTACT_EMAIL = 'lihong0211yao@gmail.com'
const BLURB_TEXT =
  "Have a project in mind or just want to say hello? I'd love to hear from you — reach out and let's start a conversation."

export default function Contact() {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#0c0c0c] px-5 py-20 sm:px-8 md:px-10"
      style={{ fontFamily: '"Kanit", sans-serif' }}
    >
      <CornerDecorations />
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn
            as="h1"
            y={40}
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Contact me
          </FadeIn>
          <FadeIn
            as="p"
            delay={0.15}
            y={20}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          >
            {BLURB_TEXT}
          </FadeIn>
        </div>
        <FadeIn delay={0.3} y={20}>
          <GradientButton href={`mailto:${CONTACT_EMAIL}`}>Email Me</GradientButton>
        </FadeIn>
      </div>
      <Link
        to="/about"
        className="relative z-10 mt-10 text-sm text-[#D7E2EA] underline-offset-4 hover:underline"
      >
        Back to About
      </Link>
    </section>
  )
}
