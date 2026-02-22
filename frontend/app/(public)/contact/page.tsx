import Link from 'next/link';

export default function ContactPage() {
  return (
    <>
      <section className="sub-hero sub-hero--contact">
        <div className="sub-hero-inner">
          <p className="sub-hero-kicker">We'd love to hear from you</p>
          <h1>Get in <em>Touch</em></h1>
          <p className="sub-hero-sub">Send us a message and we'll get back to you within 24 hours.</p>
        </div>
      </section>

      <nav className="bf-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">&gt;</span>
        <span className="current">Contact</span>
      </nav>

      <section className="contact-wrap">
        <div className="contact-info-col">
          <h2>Contact Info</h2>

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

          <div className="response-note">We typically respond within <strong>24 hours</strong> on business days.</div>
        </div>

        <div className="contact-form-card">
          <h2>Tell Us Your Message</h2>
          <p className="contact-form-sub">Fill in the form below and we'll be in touch.</p>

          <form>
            <div className="field-wrap">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" placeholder="Your full name" />
            </div>

            <div className="field-wrap">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="your@email.com" />
            </div>

            <div className="field-wrap">
              <label htmlFor="subject">Subject</label>
              <input id="subject" name="subject" type="text" placeholder="What's this about?" />
            </div>

            <div className="field-wrap">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={6} placeholder="Write your message here..." />
            </div>

            <button type="submit" className="btn-send">Send Message <span aria-hidden="true">-&gt;</span></button>
          </form>
        </div>
      </section>
    </>
  );
}