/* RobinHood Help Us — donation form.
   All validation runs client-side; no data leaves the browser. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('donationForm');
    if (!form) return;

    var els = {
      frequency: form.querySelectorAll('input[name="frequency"]'),
      presets: form.querySelectorAll('input[name="amount"]'),
      custom: document.getElementById('customAmount'),
      coverFee: document.getElementById('coverFee'),
      feeLabel: document.getElementById('feeLabel'),
      tribute: document.getElementById('tributeToggle'),
      tributeFields: document.getElementById('tributeFields'),
      cardNumber: document.getElementById('cardNumber'),
      cardBrand: document.getElementById('cardBrand'),
      expiry: document.getElementById('cardExpiry'),
      cvc: document.getElementById('cardCvc'),
      zip: document.getElementById('billingZip'),
      impact: document.getElementById('impactHint'),
      sumFrequency: document.getElementById('sumFrequency'),
      sumGift: document.getElementById('sumGift'),
      sumFee: document.getElementById('sumFee'),
      sumFeeRow: document.getElementById('sumFeeRow'),
      sumTotal: document.getElementById('sumTotal'),
      sumCadence: document.getElementById('sumCadence'),
      submitBtn: document.getElementById('donateSubmit'),
      status: document.getElementById('donateStatus')
    };

    var FEE_RATE = 0.029;
    var FEE_FIXED = 0.30;

    var IMPACT = [
      { min: 500, text: 'covers a full month of transitional housing for a family of four, including case management.' },
      { min: 250, text: 'funds a complete workforce certification — tuition, exam fee and interview clothing — for one adult learner.' },
      { min: 100, text: 'stocks a pantry shelf with 60 balanced meals for neighbors facing a hard month.' },
      { min: 50,  text: 'keeps one child in after-school tutoring and hot dinners for two weeks.' },
      { min: 25,  text: 'provides a week of fresh groceries for a household of three.' },
      { min: 1,   text: 'goes straight into the neighbourhood funds our program teams draw on every day.' }
    ];

    /* ---------- helpers ------------------------------------------------ */
    function money(value) {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function isMonthly() {
      var checked = form.querySelector('input[name="frequency"]:checked');
      return !!checked && checked.value === 'monthly';
    }

    function selectedAmount() {
      var custom = parseFloat(els.custom.value);
      if (!isNaN(custom) && custom > 0) return custom;
      var preset = form.querySelector('input[name="amount"]:checked');
      return preset ? parseFloat(preset.value) : 0;
    }

    function feeFor(amount) {
      if (!els.coverFee.checked || amount <= 0) return 0;
      return Math.round((amount * FEE_RATE + FEE_FIXED) * 100) / 100;
    }

    function setError(input, message) {
      var holder = document.getElementById(input.id + 'Error');
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (holder) holder.textContent = message || '';
      return !message;
    }

    /* ---------- live summary ------------------------------------------- */
    function updateSummary() {
      var amount = selectedAmount();
      var fee = feeFor(amount);
      var monthly = isMonthly();

      els.sumFrequency.textContent = monthly ? 'Monthly gift' : 'One-time gift';
      els.sumGift.textContent = amount > 0 ? money(amount) : '$0.00';
      els.sumFee.textContent = money(fee);
      els.sumFeeRow.hidden = fee === 0;
      els.sumTotal.textContent = money(amount + fee);
      els.sumCadence.textContent = monthly ? 'charged monthly until you cancel' : 'charged once';
      var potentialFee = amount > 0 ? Math.round((amount * FEE_RATE + FEE_FIXED) * 100) / 100 : 0;
      els.feeLabel.textContent = money(potentialFee);

      if (els.submitBtn) {
        els.submitBtn.textContent = amount > 0
          ? (monthly ? 'Give ' + money(amount + fee) + ' monthly' : 'Give ' + money(amount + fee))
          : 'Choose an amount';
      }

      var copy = IMPACT.find(function (row) { return amount >= row.min; });
      if (amount > 0 && copy) {
        els.impact.hidden = false;
        els.impact.querySelector('p').innerHTML =
          '<strong>' + money(amount) + (monthly ? ' a month ' : ' ') + '</strong>' + copy.text;
      } else {
        els.impact.hidden = true;
      }
    }

    /* ---------- amount controls ---------------------------------------- */
    Array.prototype.forEach.call(els.presets, function (input) {
      input.addEventListener('change', function () {
        els.custom.value = '';
        setError(els.custom, '');
        updateSummary();
      });
    });

    els.custom.addEventListener('input', function () {
      els.custom.value = els.custom.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      if (els.custom.value !== '') {
        Array.prototype.forEach.call(els.presets, function (input) { input.checked = false; });
      }
      updateSummary();
    });

    Array.prototype.forEach.call(els.frequency, function (input) {
      input.addEventListener('change', updateSummary);
    });

    els.coverFee.addEventListener('change', updateSummary);

    /* ---------- tribute gift ------------------------------------------- */
    if (els.tribute && els.tributeFields) {
      els.tribute.addEventListener('change', function () {
        els.tributeFields.hidden = !els.tribute.checked;
      });
    }

    /* ---------- card formatting ---------------------------------------- */
    function detectBrand(number) {
      var n = number.replace(/\s/g, '');
      if (/^4/.test(n)) return 'Visa';
      if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(n)) return 'Mastercard';
      if (/^3[47]/.test(n)) return 'Amex';
      if (/^6(011|5|4[4-9])/.test(n)) return 'Discover';
      if (/^3(0[0-5]|[68])/.test(n)) return 'Diners';
      if (/^35(2[89]|[3-8])/.test(n)) return 'JCB';
      return '';
    }

    function groupsFor(brand) {
      return brand === 'Amex' ? [4, 6, 5] : [4, 4, 4, 4];
    }

    els.cardNumber.addEventListener('input', function () {
      var digits = els.cardNumber.value.replace(/\D/g, '');
      var brand = detectBrand(digits);
      var max = brand === 'Amex' ? 15 : (brand === 'Diners' ? 14 : 16);
      digits = digits.slice(0, max);

      var out = [];
      var index = 0;
      groupsFor(brand).forEach(function (size) {
        if (index >= digits.length) return;
        out.push(digits.substr(index, size));
        index += size;
      });

      els.cardNumber.value = out.join(' ');
      els.cardBrand.textContent = brand;
      els.cardBrand.classList.toggle('is-visible', brand !== '');
      els.cvc.setAttribute('maxlength', brand === 'Amex' ? '4' : '3');
    });

    els.expiry.addEventListener('input', function () {
      var digits = els.expiry.value.replace(/\D/g, '').slice(0, 4);
      if (digits.length === 1 && parseInt(digits, 10) > 1) digits = '0' + digits;
      els.expiry.value = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits;
    });

    els.cvc.addEventListener('input', function () {
      els.cvc.value = els.cvc.value.replace(/\D/g, '').slice(0, 4);
    });

    els.zip.addEventListener('input', function () {
      els.zip.value = els.zip.value.replace(/[^0-9-]/g, '').slice(0, 10);
    });

    /* ---------- validation --------------------------------------------- */
    function luhn(number) {
      var digits = number.replace(/\D/g, '');
      if (digits.length < 12) return false;
      var sum = 0;
      var double = false;
      for (var i = digits.length - 1; i >= 0; i--) {
        var digit = parseInt(digits.charAt(i), 10);
        if (double) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        double = !double;
      }
      return sum % 10 === 0;
    }

    function validExpiry(value) {
      var match = value.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})$/);
      if (!match) return false;
      var month = parseInt(match[1], 10);
      var year = 2000 + parseInt(match[2], 10);
      if (month < 1 || month > 12) return false;
      var now = new Date();
      var end = new Date(year, month, 1);
      return end > now && year <= now.getFullYear() + 20;
    }

    function validate() {
      var ok = true;
      var amount = selectedAmount();

      if (amount < 5) {
        ok = setError(els.custom, 'Please choose or enter an amount of $5 or more.') && ok;
      } else {
        setError(els.custom, '');
      }

      [['firstName', 'Please enter your first name.'],
       ['lastName', 'Please enter your last name.'],
       ['cardName', 'Please enter the name printed on the card.'],
       ['billingAddress', 'Please enter your billing address.'],
       ['billingCity', 'Please enter your city.']].forEach(function (pair) {
        var input = document.getElementById(pair[0]);
        if (input) ok = setError(input, input.value.trim() ? '' : pair[1]) && ok;
      });

      var email = document.getElementById('email');
      ok = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Please enter a valid email address so we can send your receipt.') && ok;

      var state = document.getElementById('billingState');
      ok = setError(state, state.value ? '' : 'Please select a state.') && ok;

      ok = setError(els.zip, /^\d{5}(-\d{4})?$/.test(els.zip.value.trim()) ? '' : 'Enter a 5-digit ZIP code.') && ok;
      ok = setError(els.cardNumber, luhn(els.cardNumber.value) ? '' : 'Please check the card number.') && ok;
      ok = setError(els.expiry, validExpiry(els.expiry.value) ? '' : 'Enter a valid future expiry date (MM / YY).') && ok;

      var cvcLength = detectBrand(els.cardNumber.value) === 'Amex' ? 4 : 3;
      ok = setError(els.cvc, els.cvc.value.length === cvcLength ? '' : 'Enter the ' + cvcLength + '-digit security code.') && ok;

      return ok;
    }

    /* ---------- submit ---------------------------------------------------- */
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      els.status.className = 'form-status';

      if (!validate()) {
        els.status.textContent = 'Some details still need attention — the highlighted fields are marked below.';
        els.status.className = 'form-status is-error';
        els.status.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus({ preventScroll: true });
        return;
      }

      var amount = selectedAmount();
      var total = amount + feeFor(amount);
      els.status.innerHTML = '<strong>Thank you!</strong> Your ' + (isMonthly() ? 'monthly ' : '') +
        'gift of ' + money(total) + ' has been validated. No charge has been made to your card.';
      els.status.className = 'form-status is-success';
      els.status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    updateSummary();
  });
})();
