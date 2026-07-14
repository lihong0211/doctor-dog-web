import { FadeIn } from './FadeIn'

const BASE_URL =
  'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7'

export function CornerDecorations() {
  return (
    <>
      <FadeIn
        delay={0.1}
        duration={0.9}
        x={-80}
        y={0}
        className="absolute left-[1%] top-[4%] z-0 sm:left-[2%] md:left-[4%]"
      >
        <img
          src={`${BASE_URL}/moon_icon.11395d36.png`}
          alt=""
          className="h-auto w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.25}
        duration={0.9}
        x={-80}
        y={0}
        className="absolute bottom-[8%] left-[3%] z-0 sm:left-[6%] md:left-[10%]"
      >
        <img
          src={`${BASE_URL}/p59_1.4659672e.png`}
          alt=""
          className="h-auto w-[100px] sm:w-[140px] md:w-[180px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.15}
        duration={0.9}
        x={80}
        y={0}
        className="absolute right-[1%] top-[4%] z-0 sm:right-[2%] md:right-[4%]"
      >
        <img
          src={`${BASE_URL}/lego_icon-1.703bb594.png`}
          alt=""
          className="h-auto w-[120px] sm:w-[160px] md:w-[210px]"
        />
      </FadeIn>
      <FadeIn
        delay={0.3}
        duration={0.9}
        x={80}
        y={0}
        className="absolute bottom-[8%] right-[3%] z-0 sm:right-[6%] md:right-[10%]"
      >
        <img
          src={`${BASE_URL}/Group_134-1.2e04f3ce.png`}
          alt=""
          className="h-auto w-[130px] sm:w-[170px] md:w-[220px]"
        />
      </FadeIn>
    </>
  )
}
