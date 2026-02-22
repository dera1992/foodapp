import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <section className="sub-hero sub-hero--about">
        <div className="about-blob about-blob--one" aria-hidden="true" />
        <div className="about-blob about-blob--two" aria-hidden="true" />

        <div className="sub-hero-inner">
          <p className="sub-hero-kicker">Our Story</p>
          <h1>About <em>bunchfood</em></h1>
          <p className="sub-hero-sub">Fighting food waste, one deal at a time.</p>

          <div className="about-hero-stats">
            <div><h3>2,400+</h3><p>Meals saved</p></div>
            <div><h3>140+</h3><p>Partner shops</p></div>
            <div><h3>90%</h3><p>Max savings</p></div>
          </div>
        </div>
      </section>

      <nav className="bf-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">&gt;</span>
        <span className="current">About Us</span>
      </nav>

      <section className="about-main">
        <aside className="about-sidebar">
          <h2>Get in touch with us</h2>

          <div className="info-card">
            <div className="info-icon info-icon--phone">Phone</div>
            <div>
              <p className="info-label">Phone</p>
              <p className="info-value">Hotline: +234 806 362 7547</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon info-icon--mail">Email</div>
            <div>
              <p className="info-label">Email</p>
              <p className="info-value">bunchfood@gmail.com</p>
            </div>
          </div>

          <div className="about-cta-card">
            <h3>Have a question?</h3>
            <p>Drop us a message and we'll get back to you shortly.</p>
            <Link href="/contact" className="about-cta-btn">Contact Us -&gt;</Link>
          </div>
        </aside>

        <div className="about-content-card">
          <h2>About Us</h2>
          <p>
            bunchfood helps families save money while reducing food waste by connecting shoppers with local stores selling quality near-expiry food.
            We believe affordability and sustainability should go hand in hand.
          </p>
          <p>
            Our platform empowers neighborhood shops to recover value from surplus inventory and gives customers access to premium groceries at lower prices.
            Every order supports local businesses and a cleaner food ecosystem.
          </p>

          <hr />

          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon" style={{ background: '#e8f5eb' }}>S</div>
              <h4>Sustainability</h4>
              <p>Reducing food waste in our communities.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: '#fff3e0' }}>C</div>
              <h4>Community</h4>
              <p>Supporting local shops and buyers.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: '#fef3c7' }}>V</div>
              <h4>Savings</h4>
              <p>Up to 90% off on quality food.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="partners-wrap">
        <div className="partners-header">
          <div>
            <h2>Our Affiliate <span>Partners</span></h2>
            <p>Brands and organisations we work with.</p>
          </div>
          <a href="#" className="partners-btn">Become a partner -&gt;</a>
        </div>

        <div className="partners-grid">
          {['Partner Name', 'Partner Name', 'Partner Name', 'Partner Name', 'Partner Name', 'Partner Name'].map((name, idx) => (
            <div key={`${name}-${idx}`} className="partner-card">
              <div className="partner-icon">Co</div>
              <p>{name}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}