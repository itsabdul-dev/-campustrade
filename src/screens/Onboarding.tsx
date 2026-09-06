import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Img } from '../components/ui'

const slides = [
  {
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70',
    title: 'Trusted Campus Trading',
    body: 'Create an account to buy, sell, and trade safely within your student community.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=900&q=70',
    title: 'Every Payment in Escrow',
    body: 'We hold funds securely until you have inspected the item and confirmed the handover.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=70',
    title: 'Meet in Verified Safe Zones',
    body: 'Arrange handovers at monitored campus locations, with directions and live status built in.',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const last = index === slides.length - 1

  return (
    <main className="flex min-h-[100dvh] flex-col bg-surface px-6 pb-10 pt-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-shell justify-end">
        <Link
          to="/signup"
          className="rounded-full px-4 py-2 text-[15px] font-semibold text-ink-soft transition hover:bg-surface-sunken"
        >
          Skip
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-shell flex-1 flex-col items-center justify-center gap-10 lg:flex-row lg:gap-20">
        <div className="w-full max-w-md rounded-[32px] bg-gradient-to-br from-brand-50 to-accent-50 p-4 lg:max-w-lg lg:p-6">
          <Img
            key={slide.image}
            src={slide.image}
            alt=""
            className="aspect-square w-full rounded-[22px]"
          />
        </div>

        <div className="w-full max-w-md text-center lg:text-left">
          <h1 className="text-[34px] leading-[1.15] lg:text-5xl">{slide.title}</h1>
          <p className="mx-auto mt-4 max-w-sm text-[17px] leading-relaxed text-ink-soft lg:mx-0 lg:text-lg">
            {slide.body}
          </p>

          <div className="mt-8 flex justify-center gap-2 lg:justify-start">
            {slides.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-7 bg-brand-500' : 'w-2 bg-line'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (last ? navigate('/signup') : setIndex(index + 1))}
            className="btn-primary mt-8 w-full py-4 text-base lg:w-auto lg:px-12"
          >
            {last ? 'Get Started' : 'Next'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  )
}
