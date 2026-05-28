import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For solo therapists just getting started.',
    sms: 50,
    features: [
      '50 SMS / month included',
      'Up to 50 clients',
      'Appointment booking',
      'Basic intake forms',
      'Email notifications',
    ],
    cta: 'Get started free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: 'per month',
    description: 'For growing solo practices.',
    sms: 200,
    features: [
      '200 SMS / month included',
      'Unlimited clients',
      'Recurring appointments',
      'Treatment note templates',
      'Delivery reports dashboard',
      'Group sessions',
      'Waitlist management',
    ],
    cta: 'Start free trial',
    href: '/sign-up?plan=starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: 'per month',
    description: 'For multi-therapist clinics.',
    sms: 1000,
    features: [
      '1,000 SMS / month included',
      'Everything in Starter',
      'Staff task management',
      'Advanced reporting',
      'Xero & QuickBooks sync',
      'Note sign-off workflow',
      'Self-serve data export',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: '/sign-up?plan=pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large clinics and franchises.',
    sms: -1,
    features: [
      'Unlimited SMS',
      'Everything in Pro',
      'Multi-location support',
      'Public API access',
      'Webhooks',
      'Client portal',
      'Dedicated onboarding',
      'SLA support',
    ],
    cta: 'Contact us',
    href: 'mailto:hello@example.com',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen" style={{ background: '#FAFAFE' }}>
      {/* Header */}
      <section className="text-center px-4 pt-20 pb-12">
        <div
          className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
          style={{ background: '#EDE5F4', color: '#5D4AA8' }}
        >
          Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1E1830', letterSpacing: '-0.8px' }}>
          SMS included. Always.
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#7A7090' }}>
          Unlike Cliniko, we bundle SMS into every plan — no surprise add-on costs, no per-message fees until you exceed your allowance.
        </p>
      </section>

      {/* Plans grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                background: plan.highlight ? 'linear-gradient(145deg, #5D4AA8, #3F2F87)' : '#fff',
                border: plan.highlight ? 'none' : '1px solid #EFE9F2',
                boxShadow: plan.highlight
                  ? '0 16px 48px rgba(93,74,168,0.32)'
                  : '0 2px 12px rgba(93,74,168,0.06)',
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                  style={{ background: '#FFD166', color: '#1E1830' }}
                >
                  Most Popular
                </div>
              )}

              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#5D4AA8' }}
              >
                {plan.name}
              </p>
              <p
                className="text-4xl font-bold mb-0.5"
                style={{ color: plan.highlight ? '#fff' : '#1E1830', letterSpacing: '-1px' }}
              >
                {plan.price}
              </p>
              {plan.period && (
                <p className="text-sm mb-3" style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#7A7090' }}>
                  {plan.period}
                </p>
              )}
              <p className="text-sm mb-5" style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#7A7090' }}>
                {plan.description}
              </p>

              {/* SMS credit badge */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-5"
                style={{
                  background: plan.highlight ? 'rgba(255,255,255,0.12)' : '#EDE5F4',
                }}
              >
                <svg width="16" height="16" fill="none" stroke={plan.highlight ? '#fff' : '#5D4AA8'} strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: plan.highlight ? '#fff' : '#5D4AA8' }}>
                  {plan.sms === -1 ? 'Unlimited SMS' : `${plan.sms.toLocaleString()} SMS / mo`}
                </span>
                <span className="text-xs ml-auto font-medium" style={{ color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#7A7090' }}>
                  included
                </span>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.slice(1).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#3D3450' }}>
                    <svg className="flex-shrink-0 mt-0.5" width="14" height="14" fill="none" stroke={plan.highlight ? 'rgba(255,255,255,0.7)' : '#5D4AA8'} strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="block text-center rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={
                  plan.highlight
                    ? { background: '#fff', color: '#5D4AA8' }
                    : { background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* SMS comparison callout */}
        <div
          className="mt-12 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
          style={{ background: '#EDE5F4', border: '1px solid rgba(93,74,168,0.15)' }}
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#5D4AA8' }}>
            <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-1" style={{ color: '#1E1830' }}>
              Why we include SMS in every plan
            </h3>
            <p className="text-sm" style={{ color: '#5D4AA8' }}>
              Cliniko charges extra for SMS on top of their monthly subscription. Practitioners told us this was one of their biggest frustrations — surprise bills for something that should just work. We disagree. SMS reminders reduce no-shows by up to 30%, so we build it into every plan at no extra cost.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
          >
            Try it free
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#1E1830' }}>
            Common questions
          </h2>
          {[
            {
              q: 'What counts as one SMS credit?',
              a: 'Each SMS message sent to a client uses one credit. This includes appointment reminders, booking confirmations, and payment notifications.',
            },
            {
              q: 'What happens when I run out of credits?',
              a: 'You can enable auto-purchase of overage credits in your settings (charged per additional block via Stripe), or enable the hard-stop option to pause SMS until your next billing cycle.',
            },
            {
              q: 'Do unused credits roll over?',
              a: 'Credits reset at the start of each monthly billing cycle. Unused credits do not roll over.',
            },
            {
              q: 'Can I switch plans at any time?',
              a: 'Yes. Upgrades take effect immediately. Downgrades apply at the end of your current billing period.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #EFE9F2' }}>
              <p className="text-sm font-semibold mb-1.5" style={{ color: '#1E1830' }}>{q}</p>
              <p className="text-sm" style={{ color: '#7A7090' }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
