'use client';
// Estimated monthly cost: mortgage + property taxes + HOA + insurance.
// Uses the listing's real taxes and HOA fee. Large inputs with labels above them.
import { useId, useState } from 'react';
import s from './listing.module.css';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export function PaymentEstimate({
  price,
  annualTaxes,
  monthlyHoa,
}: {
  price: number;
  annualTaxes: number | null;
  monthlyHoa: number | null;
}) {
  const id = useId();
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5); // editable — buyers should enter the rate they were quoted
  const [years, setYears] = useState(30);
  const [insurance, setInsurance] = useState(Math.round((price * 0.006) / 12)); // rough starting point, editable

  const loan = price * (1 - downPct / 100);
  const r = rate / 100 / 12;
  const n = years * 12;
  const mortgage = loan <= 0 ? 0 : r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
  const taxes = (annualTaxes ?? price * 0.011) / 12;
  const hoa = monthlyHoa ?? 0;
  const total = mortgage + taxes + hoa + (insurance || 0);

  const field = (label: string, value: number, set: (v: number) => void, step = 1) => (
    <div>
      <label htmlFor={`${id}-${label}`}>{label}</label>
      <input
        id={`${id}-${label}`}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => set(Number(e.target.value))}
      />
    </div>
  );

  return (
    <div className={s.calc}>
      <div>
        {field('Down payment (%)', downPct, setDownPct)}
        {field('Interest rate (%)', rate, setRate, 0.125)}
        {field('Loan length (years)', years, setYears)}
        {field('Home insurance ($ per month)', insurance, setInsurance, 10)}
      </div>
      <div aria-live="polite">
        <p>Estimated monthly cost</p>
        <p className={s.calcTotal}>{money(total)} / month</p>
        <ul className={s.calcRows}>
          <li><span>Mortgage (principal + interest)</span><span>{money(mortgage)}</span></li>
          <li><span>Property taxes{annualTaxes ? '' : ' (estimate)'}</span><span>{money(taxes)}</span></li>
          <li><span>HOA / condo fee</span><span>{money(hoa)}</span></li>
          <li><span>Home insurance (your estimate)</span><span>{money(insurance || 0)}</span></li>
        </ul>
        <p className={s.note}>
          An estimate only. Flood insurance and your actual rate can change this — call us and we&apos;ll go through it with you.
        </p>
      </div>
    </div>
  );
}
