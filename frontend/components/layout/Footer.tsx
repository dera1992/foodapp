import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bf-footer">
      <div className="bf-footer-grid">
        <div className="bf-footer-brand">
          <Link href="/" className="bf-logo">bunch<span style={{ color: 'var(--accent)' }}>food</span></Link>
          <p>Connecting communities with local shops to reduce food waste and save money. Fresh deals, every single day.</p>
          <div className="bf-social-links">
            <a href="#" className="bf-social-link">f</a>
            <a href="#" className="bf-social-link">in</a>
            <a href="#" className="bf-social-link">tw</a>
            <a href="#" className="bf-social-link">ig</a>
          </div>
        </div>

        <div className="bf-footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><a href="#">How it works</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        <div className="bf-footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>

        <div className="bf-footer-col">
          <h4>My Account</h4>
          <ul>
            <li><a href="#">My Profile</a></li>
            <li><Link prefetch={false} href="/cart">Shopping Cart</Link></li>
            <li><a href="#">Shop Order</a></li>
            <li><Link prefetch={false} href="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
      </div>
      <div className="bf-footer-bottom">
        <p>{'\u00A9 2026 bunchfood. All Rights Reserved.'}</p>
        <p>{'Made with \u{1F49A} for your community'}</p>
      </div>
    </footer>
  );
}
