// Shown with a real HTTP 404 when an MLS number doesn't exist.
import Link from 'next/link';

export default function ListingNotFound() {
  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', fontSize: '1.125rem', lineHeight: 1.6 }}>
      <h1>We couldn&apos;t find that home</h1>
      <p>It may have been sold or taken off the market.</p>
      <p>
        <Link href="/Florida-Real-Estate-Search/Naples">See Naples homes for sale</Link> or call us at{' '}
        <a href="tel:+12399929119">239-992-9119</a> and we&apos;ll help you find it.
      </p>
    </main>
  );
}
