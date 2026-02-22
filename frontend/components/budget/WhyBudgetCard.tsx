const WHY_ITEMS = [
  {
    icon: '📊',
    title: 'Track total costs',
    desc: 'See a live running total as you add products to your shopping list.'
  },
  {
    icon: '🔔',
    title: 'Receive alerts',
    desc: 'Get notified instantly when your cart is approaching or exceeds your set limit.'
  },
  {
    icon: '🏷️',
    title: 'Highlight deals within budget',
    desc: 'We surface discounted items that fit your remaining budget automatically.'
  },
  {
    icon: '🤖',
    title: 'AI-powered suggestions',
    desc: 'Our AI scans price trends to recommend the best time to buy.'
  }
];

export function WhyBudgetCard() {
  return (
    <article className="bf-budget-create-why-card">
      <header className="bf-budget-create-why-header">
        <h2>Why Set A Budget?</h2>
        <p>Smart spending starts with knowing your limit.</p>
      </header>

      <div className="bf-budget-create-why-list">
        {WHY_ITEMS.map((item) => (
          <div className="bf-budget-create-why-item" key={item.title}>
            <span className="bf-budget-create-why-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bf-budget-create-tip">
        <span aria-hidden="true">💡</span>
        <div>
          <strong>Pro tip</strong>
          <p>Set your budget 10-15% lower than your actual limit so you keep a buffer for impulse deals.</p>
        </div>
      </div>
    </article>
  );
}

