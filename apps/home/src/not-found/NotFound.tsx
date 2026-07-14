import { BackgroundVideo } from './BackgroundVideo'
import { Footer } from './Footer'
import { Hero404 } from './Hero404'
import { Navbar } from './Navbar'

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ fontFamily: '"Helvetica Now Var", Helvetica, Arial, sans-serif' }}
    >
      <BackgroundVideo />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <Hero404 />
        <Footer />
      </div>
    </div>
  )
}
