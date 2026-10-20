// check_sync.js - сверка расчётных констант между index.html и test_calc.js
const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlFile = path.join(root, 'index.html');
const testFile = path.join(root, 'test_calc.js');

function extractConstants(content, filename) {
  const result = {};
  const tmMatch = content.match(/(?:const|let|var)\s+TERM_MONTHS\s*=\s*(\d+)/);
  result.TERM_MONTHS = tmMatch ? parseInt(tmMatch[1], 10) : undefined;
  const psMatch = content.match(/PRICE_SCHEDULE\s*=\s*(\[.*?\]);/s);
  if (psMatch) {
    try {
      const items = psMatch[1].match(/\{[^}]+\}/g) || [];
      result.PRICE_SCHEDULE = items.map(obj => {
        const maxDebtMatch = obj.match(/maxDebt\s*:\s*([0-9e+.\-]+)/);
        const basePriceMatch = obj.match(/basePrice\s*:\s*([0-9e+.\-]+)/);
        const monthlyPaymentMatch = obj.match(/monthlyPayment\s*:\s*([0-9e+.\-]+)/);
        return {
          maxDebt: maxDebtMatch ? parseFloat(maxDebtMatch[1]) : undefined,
          basePrice: basePriceMatch ? parseFloat(basePriceMatch[1]) : undefined,
          monthlyPayment: monthlyPaymentMatch ? parseFloat(monthlyPaymentMatch[1]) : undefined
        };
      });
    } catch (e) {
      result.PRICE_SCHEDULE_ERROR = 'Ошибка парсинга: ' + e.message;
    }
  }
  const espMatch = content.match(/EXTRA_SERVICE_PRICES\s*=\s*\{([^}]+)\}/s);
  if (espMatch) {
    const props = {
      propertyProtection: espMatch[1].match(/propertyProtection\s*:\s*(\d+)/),
      singleHousing: espMatch[1].match(/singleHousing\s*:\s*(\d+)/),
      efrsbPublications: espMatch[1].match(/efrsbPublications\s*:\s*(\d+)/)
    };
    result.EXTRA_SERVICE_PRICES = {};
    for (const key in props) {
      result.EXTRA_SERVICE_PRICES[key] = props[key] ? parseInt(props[key][1], 10) : undefined;
    }
  }
  return result;
}

const html = extractConstants(fs.readFileSync(htmlFile, 'utf-8'), 'index.html');
const test = extractConstants(fs.readFileSync(testFile, 'utf-8'), 'test_calc.js');
let errors = 0;

function check(name, a, b, file) {
  if (a !== b) {
    console.error('❌ ' + name + ': ' + file + ' = ' + a + ', test_calc.js = ' + b);
    errors++;
  } else {
    console.log('✅ ' + name + ': ' + a);
  }
}

console.log('=== Сверка констант ===\n');

if (html.TERM_MONTHS === undefined) { console.error('❌ TERM_MONTHS не найден в index.html'); errors++; }
if (test.TERM_MONTHS === undefined) { console.error('❌ TERM_MONTHS не найден в test_calc.js'); errors++; }
if (html.TERM_MONTHS !== undefined && test.TERM_MONTHS !== undefined) {
  check('TERM_MONTHS', html.TERM_MONTHS, test.TERM_MONTHS, 'index.html');
}

if (html.PRICE_SCHEDULE_ERROR) { console.error('❌ ' + html.PRICE_SCHEDULE_ERROR); errors++; }
if (test.PRICE_SCHEDULE_ERROR) { console.error('❌ ' + test.PRICE_SCHEDULE_ERROR); errors++; }

if (html.PRICE_SCHEDULE && test.PRICE_SCHEDULE) {
  check('PRICE_SCHEDULE.length', html.PRICE_SCHEDULE.length, test.PRICE_SCHEDULE.length, 'index.html');
  for (let i = 0; i < Math.max(html.PRICE_SCHEDULE.length, test.PRICE_SCHEDULE.length); i++) {
    const h = html.PRICE_SCHEDULE[i] || {};
    const t = test.PRICE_SCHEDULE[i] || {};
    check('PRICE_SCHEDULE[' + i + '].maxDebt', h.maxDebt, t.maxDebt, 'index.html');
    check('PRICE_SCHEDULE[' + i + '].basePrice', h.basePrice, t.basePrice, 'index.html');
    check('PRICE_SCHEDULE[' + i + '].monthlyPayment', h.monthlyPayment, t.monthlyPayment, 'index.html');
  }
}

if (html.EXTRA_SERVICE_PRICES && test.EXTRA_SERVICE_PRICES) {
  for (const key of ['propertyProtection', 'singleHousing', 'efrsbPublications']) {
    check('EXTRA_SERVICE_PRICES.' + key, html.EXTRA_SERVICE_PRICES[key], test.EXTRA_SERVICE_PRICES[key], 'index.html');
  }
}

console.log('\n' + (errors === 0 ? '✅ Расхождения не найдены' : '❌ Найдено ' + errors + ' расхождений'));
process.exit(errors > 0 ? 1 : 0);
