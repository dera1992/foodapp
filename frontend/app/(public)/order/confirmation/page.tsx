import Link from 'next/link';
import { CheckCircle2, Clock3, MapPinned, PackageCheck, ReceiptText, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Container } from '@/components/layout/Container';
import { formatDate } from '@/lib/utils/format';
import styles from './ConfirmationPage.module.css';

type SearchParams = Record<string, string | string[] | undefined>;

function parseOrderIds(searchParams?: SearchParams) {
  const raw = searchParams?.orders;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export default async function OrderConfirmationPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolved = searchParams && typeof (searchParams as Promise<SearchParams>).then === 'function'
    ? await (searchParams as Promise<SearchParams>)
    : (searchParams as SearchParams | undefined);
  const orderIds = parseOrderIds(resolved);
  const placedOn = formatDate(new Date());

  return (
    <div className={styles.pageWrap}>
      <div className={styles.texture} aria-hidden />
      <Container className={styles.container}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Checkout', href: '/checkout' }, { label: 'Confirmation' }]} />

        <section className={styles.heroCard}>
          <div className={styles.heroBadge}>
            <CheckCircle2 className="h-4 w-4" />
            Order Confirmed
          </div>
          <h1 className={styles.heroTitle}>Thank you. Your order is confirmed.</h1>
          <p className={styles.heroSubtitle}>
            We have received your order and started notifying the shop{orderIds.length === 1 ? '' : 's'}.
            You&apos;ll see updates as each shop prepares your items.
          </p>

          <div className={styles.heroMetaGrid}>
            <div className={styles.metaCard}>
              <ReceiptText className={styles.metaIcon} />
              <div>
                <p className={styles.metaLabel}>Order references</p>
                <p className={styles.metaValue}>{orderIds.length ? `${orderIds.length} order${orderIds.length === 1 ? '' : 's'}` : 'Generated successfully'}</p>
              </div>
            </div>
            <div className={styles.metaCard}>
              <Clock3 className={styles.metaIcon} />
              <div>
                <p className={styles.metaLabel}>Placed on</p>
                <p className={styles.metaValue}>{placedOn}</p>
              </div>
            </div>
            <div className={styles.metaCard}>
              <PackageCheck className={styles.metaIcon} />
              <div>
                <p className={styles.metaLabel}>Status</p>
                <p className={styles.metaValue}>Pending shop confirmation</p>
              </div>
            </div>
          </div>

          <div className={styles.primaryActions}>
            <Link href="/account/orders" className={styles.primaryBtn}>
              View My Orders
            </Link>
            <Link href="/order-tracking" className={styles.secondaryBtn}>
              Track Order
            </Link>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Order References</h2>
            {orderIds.length ? (
              <ul className={styles.refList}>
                {orderIds.map((id) => (
                  <li key={id} className={styles.refItem}>
                    <span className={styles.refPill}>{id}</span>
                    <span className={styles.refHint}>Keep this reference for support or payment reconciliation.</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>
                Your order was placed successfully. The references may appear in your order history in a moment.
              </p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>What Happens Next</h2>
            <ul className={styles.stepsList}>
              <li>
                <span>1</span>
                <div>
                  <strong>Shops are notified</strong>
                  <p>Each shop receives the items assigned to them and begins preparation.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Status updates arrive</strong>
                  <p>Track progress from your orders page and receive notifications as things move.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Delivery or pickup</strong>
                  <p>Bring your order reference for pickup, or wait for dispatch updates if delivery was selected.</p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <section className={styles.infoBand}>
          <div className={styles.infoItem}>
            <ShieldCheck className="h-4 w-4" />
            <span>Secure checkout completed</span>
          </div>
          <div className={styles.infoItem}>
            <MapPinned className="h-4 w-4" />
            <span>Local shops have been notified</span>
          </div>
          <div className={styles.infoActions}>
            <Link href="/shops" className={styles.textLink}>Continue shopping</Link>
            <Link href="/messages" className={styles.textLink}>Messages</Link>
          </div>
        </section>
      </Container>
    </div>
  );
}

