const steps = [
  {
    num: 1,
    icon: '📍',
    title: 'Find local shops',
    desc: 'Share your location to see verified nearby shops with surplus stock.',
  },
  {
    num: 2,
    icon: '🛒',
    title: 'Pick deals before expiry',
    desc: 'Browse near-expiry items at up to 90% off — fresh, safe, local.',
  },
  {
    num: 3,
    icon: '📦',
    title: 'Collect or get delivery',
    desc: 'Pick up in minutes or get it delivered straight to your door.',
  },
];

export function HowItWorksCard() {
  return (
    <div className="hiw-card">
      <div className="hiw-header">
        <span className="hiw-label">How it works</span>
        <span className="hiw-steps-pill">3 steps</span>
      </div>

      <div>
        {steps.map((step, i) => (
          <div key={step.num}>
            <div className="hiw-step">
              <div className="hiw-num">{step.num}</div>
              <div className="hiw-ic">{step.icon}</div>
              <div>
                <div className="hiw-title">{step.title}</div>
                <div className="hiw-desc">{step.desc}</div>
              </div>
            </div>
            {i < steps.length - 1 && <div className="hiw-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
