import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';

const roleGuides = [
  {
    id: 'customer',
    eyebrow: 'For Customers',
    icon: '🛍️',
    title: 'Save money on quality near-expiry food',
    summary: 'Browse local deals, place an order, and track delivery in real time.',
    accent: 'from-emerald-100 to-white',
    chip: 'bg-emerald-100 text-emerald-800',
    ctaHref: '/shops',
    ctaLabel: 'Browse deals',
    steps: [
      {
        title: 'Create an account or continue browsing',
        body: 'Search nearby shops, explore discounted products, and save favourites to your wishlist before checkout.'
      },
      {
        title: 'Add items to cart and choose delivery or pickup',
        body: 'Review your basket, apply available discounts, and confirm your order with your preferred fulfilment option.'
      },
      {
        title: 'Track your order status',
        body: 'Use the Messages and Order Tracking pages to follow updates from processing through delivery.'
      },
      {
        title: 'Rate, reorder, and manage your budget',
        body: 'Use analytics and budget tools to understand your spending and quickly reorder from trusted shops.'
      }
    ]
  },
  {
    id: 'shop',
    eyebrow: 'For Shop Owners',
    icon: '🏪',
    title: 'Turn surplus stock into revenue',
    summary: 'List products quickly, manage expiring inventory, and monitor performance from your admin dashboard.',
    accent: 'from-blue-100 to-white',
    chip: 'bg-blue-100 text-blue-800',
    ctaHref: '/admin',
    ctaLabel: 'Go to dashboard',
    steps: [
      {
        title: 'Set up your shop profile and onboarding',
        body: 'Complete shop details, upload documents, and choose a plan that matches your inventory volume.'
      },
      {
        title: 'Add products individually or in bulk',
        body: 'Use the Add Product form or bulk upload flow to list near-expiry products with pricing, images, and expiry dates.'
      },
      {
        title: 'Manage orders and customer communication',
        body: 'Track statuses, coordinate fulfilment, and reply to customer messages from the admin panel.'
      },
      {
        title: 'Use analytics to optimize stock and pricing',
        body: 'Monitor top-selling items, customer reach, low-stock alerts, and upgrade plans as your shop grows.'
      }
    ]
  },
  {
    id: 'dispatcher',
    eyebrow: 'For Dispatchers',
    icon: '🚴',
    title: 'Accept deliveries and complete routes reliably',
    summary: 'Onboard your vehicle, receive assignments, and help shops deliver orders on time.',
    accent: 'from-amber-100 to-white',
    chip: 'bg-amber-100 text-amber-800',
    ctaHref: '/account/dispatcher/onboarding',
    ctaLabel: 'Start dispatcher onboarding',
    steps: [
      {
        title: 'Complete dispatcher onboarding',
        body: 'Submit personal details, vehicle info, and required documents for verification.'
      },
      {
        title: 'Receive delivery assignments',
        body: 'Get notified when orders are ready for pickup and review destination details before heading out.'
      },
      {
        title: 'Update order progress',
        body: 'Mark deliveries as picked up, out for delivery, and delivered so customers can track ETA accurately.'
      },
      {
        title: 'Build trust through reliability',
        body: 'Timely deliveries improve dispatcher ratings and help shops maintain strong customer relationships.'
      }
    ]
  }
] as const;

const platformFlow = [
  {
    title: 'Discover or list products',
    text: 'Customers discover discounted food deals while shops publish near-expiry inventory with clear pricing and expiry dates.',
    icon: '🔎'
  },
  {
    title: 'Order and confirm',
    text: 'Orders are placed through the cart, confirmed by the shop, and prepared for pickup or delivery.',
    icon: '🧾'
  },
  {
    title: 'Dispatch and track',
    text: 'Dispatchers or shop staff update progress so customers can track each order from processing to delivery.',
    icon: '🚚'
  },
  {
    title: 'Analyze and improve',
    text: 'Analytics and dashboards help all sides improve performance, reduce waste, and save more over time.',
    icon: '📈'
  }
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(76,175,99,0.18),_transparent_45%),linear-gradient(135deg,#f4f7f4_0%,#eef7ef_45%,#ffffff_100%)] py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,_#c8d9c9_1px,_transparent_1px)] [background-size:28px_28px]" />
        <Container className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-primaryDark backdrop-blur">
              <span aria-hidden="true">✨</span>
              How bunchfood works
            </div>
            <h1 className="font-serif text-4xl font-black leading-tight text-brand-text md:text-6xl">
              One platform for <span className="text-brand-primary italic">customers</span>, shops, and dispatchers
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-brand-muted md:text-lg">
              bunchfood connects local shops with customers looking for affordable food deals, while dispatchers help complete deliveries quickly and reliably.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="#customer" className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:bg-brand-primaryLight hover:text-brand-primaryDark">
                Customer journey
              </Link>
              <Link href="#shop" className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:bg-brand-primaryLight hover:text-brand-primaryDark">
                Shop workflow
              </Link>
              <Link href="#dispatcher" className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:bg-brand-primaryLight hover:text-brand-primaryDark">
                Dispatcher flow
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-transparent py-10 md:py-14">
        <Container>
          <Card className="overflow-hidden bg-white p-0">
            <div className="border-b border-brand-border px-6 py-5 md:px-8">
              <h2 className="text-2xl font-semibold text-brand-text">How the platform works</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                A simple end-to-end flow from inventory listing to order fulfillment and tracking.
              </p>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2 md:gap-5 md:p-8 lg:grid-cols-4">
              {platformFlow.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-brand-border bg-brand-background p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {step.icon}
                    </span>
                    <span className="text-xs font-bold text-brand-muted">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-brand-text">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="pb-12 md:pb-16">
        <Container className="space-y-6">
          {roleGuides.map((guide) => (
            <Card key={guide.id} id={guide.id} className="overflow-hidden bg-white p-0">
              <div className={`border-b border-brand-border bg-gradient-to-r ${guide.accent} px-6 py-5 md:px-8`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${guide.chip}`}>
                      <span aria-hidden="true">{guide.icon}</span>
                      {guide.eyebrow}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-brand-text md:text-3xl">{guide.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted md:text-base">{guide.summary}</p>
                  </div>
                  <Link
                    href={guide.ctaHref}
                    className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primaryDark"
                  >
                    {guide.ctaLabel} →
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:gap-5 md:p-8 lg:grid-cols-2">
                {guide.steps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-primaryLight text-sm font-bold text-brand-primaryDark">
                        {index + 1}
                      </div>
                      <h3 className="text-base font-semibold text-brand-text">{step.title}</h3>
                    </div>
                    <p className="text-sm leading-6 text-brand-muted">{step.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-r from-brand-primaryDark via-[#236a31] to-brand-primary p-8 text-white shadow-card md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle,_#ffffff_1px,_transparent_1px)] [background-size:20px_20px]" />
            <div className="relative grid gap-6 rounded-2xl border border-white/15 bg-black/10 p-5 backdrop-blur-[1px] md:grid-cols-[1.4fr_auto] md:items-center md:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Start your journey</p>
                <h2 className="mt-2 font-serif text-3xl font-black leading-tight md:text-4xl">
                  Use bunchfood your way
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 md:text-base">
                  Shop smarter as a customer, recover revenue as a shop owner, or deliver with confidence as a dispatcher.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primaryDark">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
