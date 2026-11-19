// Key facts near the top, including price per sq ft, days on market and monthly HOA (missing today).
import { community, fmtInt, fmtMoney, num, typeLabel, type Listing } from '@/lib/seo/listing';
import s from './listing.module.css';

export function hoaMonthly(l: Listing): number | null {
  const fee = num(l.AssociationFee);
  if (!fee) return null;
  const f = (l.AssociationFeeFrequency ?? 'Monthly').toLowerCase();
  if (f.startsWith('quarter')) return fee / 3;
  if (f.startsWith('semi')) return fee / 6;
  if (f.startsWith('annual') || f.startsWith('year')) return fee / 12;
  return fee;
}

export function KeyFacts({ listing: l }: { listing: Listing }) {
  const price = num(l.ListPrice);
  const sqft = num(l.LivingArea);
  const hoa = hoaMonthly(l);
  const rows: [string, string | null][] = [
    ['Price', price ? fmtMoney(price) : null],
    ['Price per sq ft', price && sqft ? fmtMoney(price / sqft) : null],
    ['Bedrooms', num(l.BedroomsTotal)?.toString() ?? null],
    ['Bathrooms', num(l.BathroomsTotalInteger)?.toString() ?? null],
    ['Living area', sqft ? `${fmtInt(sqft)} sq ft` : null],
    ['Lot size', num(l.LotSizeAcres) ? `${num(l.LotSizeAcres)} acres` : null],
    ['Year built', num(l.YearBuilt)?.toString() ?? null],
    ['HOA / condo fee', hoa ? `${fmtMoney(hoa)} per month` : null],
    ['Property taxes', num(l.TaxAnnualAmount) ? `${fmtMoney(num(l.TaxAnnualAmount)!)} per year` : null],
    ['Days on market', num(l.DaysOnMarket)?.toString() ?? null],
    ['Type', [typeLabel(l), l.PropertySubType].filter(Boolean).join(' — ')],
    ['Community', community(l)],
    ['MLS number', l.ListingId],
    ['Listing office', l.ListOfficeName ?? null],
  ];
  return (
    <dl className={s.keyFacts}>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  );
}
