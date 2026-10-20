// Тестовый скрипт проверки расчётов калькулятора
const TERM_MONTHS = 14;
const PRICE_SCHEDULE = [
  {maxDebt: 300000,   basePrice: 68700,  monthlyPayment: 7400, label: 'До 300 000 ₽'},
  {maxDebt: 500000,   basePrice: 96100,  monthlyPayment: 10800, label: 'До 500 000 ₽'},
  {maxDebt: 1500000,  basePrice: 131200, monthlyPayment: 14400, label: 'До 1 500 000 ₽'},
  {maxDebt: 3000000,  basePrice: 156900, monthlyPayment: 16000, label: 'До 3 000 000 ₽'},
  {maxDebt: 6000000,  basePrice: 216800, monthlyPayment: 22400, label: 'До 6 000 000 ₽'},
  {maxDebt: 10000000, basePrice: 302400, monthlyPayment: 29600, label: 'До 10 000 000 ₽'},
  {maxDebt: Infinity, basePrice: 428000, monthlyPayment: 44000, label: 'Более 10 000 000 ₽'}
];
const EXTRA_SERVICE_PRICES = {
  propertyProtection: 40000,
  singleHousing: 24000,
  efrsbPublications: 12000
};

function calcBase(debt, opts) {
  const tier = PRICE_SCHEDULE.find(t => debt <= t.maxDebt);
  const baseMonthlyPayment = tier.monthlyPayment;
  const basePrice = tier.basePrice;
  let costDop = EXTRA_SERVICE_PRICES.efrsbPublications; // всегда
  if (opts.singleHousing) costDop += EXTRA_SERVICE_PRICES.singleHousing;
  if (opts.propertyProtect) costDop += EXTRA_SERVICE_PRICES.propertyProtection;
  if (opts.business === 'ip' || opts.business === 'ooo') costDop += 40000;
  if (opts.business === 'both') costDop += 80000;
  const totalBase = (baseMonthlyPayment * TERM_MONTHS) + costDop;
  const famPct = opts.familyDiscount ? 10 : 0;
  const discountRub = Math.round(totalBase * famPct / 100);
  const totalAfter = totalBase - discountRub;
  const finalMonthly = Math.ceil(totalAfter / TERM_MONTHS / 100) * 100;
  const finalTotal = finalMonthly * TERM_MONTHS;
  return { tier, basePrice, baseMonthlyPayment, costDop, familyDiscountPercent: famPct, discountPercentRub: discountRub, totalBase, finalMonthlyPayment: finalMonthly, finalTotalStandard: finalTotal };
}

function generateSchedule(monthly, termMonths, promoMode) {
  const upfrontMonths = promoMode === '2+1' ? 2 : promoMode === '4+2' ? 4 : 0;
  const skippedMonths = promoMode === '2+1' ? 1 : promoMode === '4+2' ? 2 : 0;
  const rows = [];
  let cumulative = 0;
  for (let m = 1; m <= termMonths; m++) {
    let status = 'Ежемесячно', payment = monthly;
    if (m <= upfrontMonths) { status = 'Оплачено сразу'; payment = monthly; }
    else if (m > termMonths - skippedMonths) { status = 'Исключён по акции'; payment = 0; }
    cumulative += payment;
    rows.push({ month: m, status, payment, cumulative });
  }
  const upfrontPayment = monthly * upfrontMonths;
  const remainingCount = Math.max(0, termMonths - upfrontMonths - skippedMonths);
  const totalWithPromo = upfrontPayment + (monthly * remainingCount);
  return { rows, upfrontPayment, remainingCount, totalWithPromo };
}

function calcWithPromo(base, promoActive) {
  if (promoActive) {
    const discount = Math.round(base * 0.13);
    const totalAfter = base - discount;
    return { total: totalAfter, discount, promoActive: true };
  } else {
    const extra = Math.ceil(base * 0.13 / 100) * 100;
    const totalWith = base + extra;
    return { total: totalWith, extra, promoActive: false };
  }
}

// === ТЕСТЫ ===
function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
}

// Тест 1: Долг 250000, без допов, без скидки, без промокода
let c = calcBase(250000, {propertyProtect: false, business: 'none', singleHousing: false, familyDiscount: false});
assert(c.tier.label === 'До 300 000 ₽', 'Тариф для 250000');
assert(c.basePrice === 68700, 'Базовая стоимость 68700');
assert(c.baseMonthlyPayment === 7400, 'Базовый платёж 7400');
assert(c.costDop === 12000, 'Допы = 12000 (ЕФРСБ)');
assert(c.totalBase === 115600, 'totalBase = 115600');
assert(c.finalMonthlyPayment === 8300, 'Финальный платёж = 8300');
assert(c.finalTotalStandard === 116200, 'Итого за срок = 116200');

// Тест 2: Долг 500000, защита имущества, семейная скидка
c = calcBase(500000, {propertyProtect: true, business: 'none', singleHousing: false, familyDiscount: true});
assert(c.tier.label === 'До 500 000 ₽', 'Тариф для 500000');
assert(c.costDop === 52000, 'Допы = 52000 (ЕФРСБ + защита)');
assert(c.totalBase === 203200, 'totalBase = 203200');
assert(c.discountPercentRub === 20320, 'Скидка = 20320');
assert(c.finalMonthlyPayment === 13100, 'Финальный платёж = 13100');
assert(c.finalTotalStandard === 183400, 'Итого за срок = 183400');

// Тест 3: Долг 5000000, 2 допа (защита+жильё), ИП, без скидки
c = calcBase(5000000, {propertyProtect: true, business: 'ip', singleHousing: true, familyDiscount: false});
// costDop = 12000 + 24000 + 40000 + 40000 = 116000
assert(c.costDop === 116000, 'Допы = 116000 (ЕФРСБ+жильё+защита+ИП)');
assert(c.totalBase === 429600, 'totalBase = 429600');
assert(c.finalMonthlyPayment === 30700, 'Финальный платёж = 30700');

// Тест 4: Долг 5000000, Оба (ИП+ООО) = 80000
c = calcBase(5000000, {propertyProtect: false, business: 'both', singleHousing: false, familyDiscount: false});
// costDop = 12000 + 80000 = 92000
assert(c.costDop === 92000, 'Допы = 92000 (ЕФРСБ+ИП+ООО)');

// Тест 5: График 2+1 для платежа 8300
let s = generateSchedule(8300, 14, '2+1');
assert(s.rows.length === 14, 'График 2+1: 14 строк');
assert(s.rows[0].status === 'Оплачено сразу', 'Месяц 1: Оплачено сразу');
assert(s.rows[1].status === 'Оплачено сразу', 'Месяц 2: Оплачено сразу');
assert(s.rows[2].status === 'Ежемесячно', 'Месяц 3: Ежемесячно');
assert(s.rows[13].status === 'Исключён по акции', 'Месяц 14: Исключён по акции');
assert(s.upfrontPayment === 16600, 'Upfront = 16600');
assert(s.remainingCount === 11, 'Осталось 11 платежей');
assert(s.totalWithPromo === 16600 + 8300*11, 'totalWithPromo = ' + s.totalWithPromo);

// Тест 6: График 4+2 для платежа 8300
s = generateSchedule(8300, 14, '4+2');
assert(s.rows.length === 14, 'График 4+2: 14 строк');
assert(s.rows[3].status === 'Оплачено сразу', 'Месяц 4: Оплачено сразу');
assert(s.rows[4].status === 'Ежемесячно', 'Месяц 5: Ежемесячно');
assert(s.rows[12].status === 'Исключён по акции', 'Месяц 13: Исключён по акции');
assert(s.rows[13].status === 'Исключён по акции', 'Месяц 14: Исключён по акции');
assert(s.upfrontPayment === 33200, 'Upfront = 33200');
assert(s.remainingCount === 8, 'Осталось 8 платежей');
assert(s.totalWithPromo === 33200 + 8300*8, 'totalWithPromo = ' + s.totalWithPromo);

// Тест 7: Промокод активен — скидка 13%
const promoOn = calcWithPromo(116200, true);
assert(promoOn.total === 116200 - Math.round(116200 * 0.13), 'Промокод ON: скидка 13%');
assert(promoOn.discount === Math.round(116200 * 0.13), 'Промокод ON: скидка = ' + promoOn.discount);

// Тест 8: Промокод выключен — +13%
const promoOff = calcWithPromo(116200, false);
assert(promoOff.extra === Math.ceil(116200 * 0.13 / 100) * 100, 'Промокод OFF: +13% округлён вверх');
assert(promoOff.total === 116200 + promoOff.extra, 'Промокод OFF: total = base + extra');

// Тест 9: Долг 10000000+
c = calcBase(15000000, {propertyProtect: false, business: 'none', singleHousing: false, familyDiscount: false});
assert(c.tier.label === 'Более 10 000 000 ₽', 'Тариф для 15 млн');
assert(c.baseMonthlyPayment === 44000, 'Базовый платёж 44000');

// Тест 10: Долг ровно 300000
c = calcBase(300000, {propertyProtect: false, business: 'none', singleHousing: false, familyDiscount: false});
assert(c.tier.label === 'До 300 000 ₽', 'Тариф для ровно 300000');

// Тест 11: Долг 300001
c = calcBase(300001, {propertyProtect: false, business: 'none', singleHousing: false, familyDiscount: false});
assert(c.tier.label === 'До 500 000 ₽', 'Тариф для 300001');

// Тест 12: Промокод 0 — проверка округления вверх
const p0 = calcWithPromo(0, false);
assert(p0.extra === 0, 'Промокод OFF при 0 = 0');

console.log('\n✅ Все тесты пройдены!');
