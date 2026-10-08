/* =========================================================
   KIMAKOD — Tulis. Kodekan. Terjemahkan.
   script.js — encoder & decoder sistem kode Kimakod
   JavaScript murni, tanpa backend, tanpa dependensi.
   ========================================================= */

/* ---------- 1. SUPERSKRIP (PANGKAT) ---------- */
const SUP = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
const SUP_CHARS = '¹²³⁴⁵';

/* ---------- 2. PETA HURUF VOKAL ---------- */
/* A → ¹ , E → ² , I → ³ , O → ⁴ , U → ⁵ */
const VOWEL_MAP = {
  A: SUP[1],
  E: SUP[2],
  I: SUP[3],
  O: SUP[4],
  U: SUP[5]
};

/* ---------- 3. PETA HURUF KONSONAN ---------- */
/* angka dasar + pangkat (1, 2, atau 3) */
const CONSONANT_MAP = {
  J: '1' + SUP[1], S: '1' + SUP[2],
  B: '2' + SUP[1], K: '2' + SUP[2], T: '2' + SUP[3],
  C: '3' + SUP[1], L: '3' + SUP[2],
  D: '4' + SUP[1], M: '4' + SUP[2], V: '4' + SUP[3],
  N: '5' + SUP[1], W: '5' + SUP[2],
  F: '6' + SUP[1], X: '6' + SUP[2],
  G: '7' + SUP[1], P: '7' + SUP[2], Y: '7' + SUP[3],
  H: '8' + SUP[1], Q: '8' + SUP[2], Z: '8' + SUP[3],
  R: '9' + SUP[1]
};

/* gabungan semua huruf, dipakai encoder */
const LETTER_MAP = Object.assign({}, VOWEL_MAP, CONSONANT_MAP);

/* ---------- 4. PETA ANGKA (PER DIGIT) ---------- */
/* SATU DIGIT = SATU ANGKA ROMAWI. Angka tidak pernah digabung. */
const NUMBER_MAP = {
  '0': '0',
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
  '9': 'IX'
};

/* ---------- 5. SIMBOL PEMISAH ---------- */
const LETTER_SEP = '•';  /* pemisah antarhuruf / antardigit */
const WORD_SEP = '|';    /* pemisah antarkata               */

/* ---------- 6. TABEL BALIK (kode → huruf/angka) ---------- */
const DECODE_LETTER = (function () {
  const map = {};
  for (const letter in LETTER_MAP) map[LETTER_MAP[letter]] = letter;
  return map;
})();

const DECODE_NUMBER = (function () {
  const map = {};
  for (const digit in NUMBER_MAP) map[NUMBER_MAP[digit]] = digit;
  return map;
})();

/* token angka Romawi, diurutkan dari yang terpanjang (longest match) */
const ROMAN_TOKENS = ['VIII', 'III', 'VII', 'II', 'IV', 'VI', 'IX', 'V', 'I'];

/* =========================================================
   7. ENCODER
   ========================================================= */

/* Huruf tunggal (vokal / konsonan) → kode Kimakod. */
function encodeLetter(char) {
  const upper = String(char).toUpperCase();
  return Object.prototype.hasOwnProperty.call(LETTER_MAP, upper) ? LETTER_MAP[upper] : null;
}

/* Satu digit angka → satu kode Romawi Kimakod. */
function encodeNumber(char) {
  const digit = String(char);
  return Object.prototype.hasOwnProperty.call(NUMBER_MAP, digit) ? NUMBER_MAP[digit] : null;
}

/* Satu kata → deretan kode dipisah "•". Tanda baca dipertahankan. */
function encodeWord(word) {
  let result = '';
  let lastWasCode = false;

  for (const char of word) {
    let code = null;

    if (/[A-Z]/.test(char.toUpperCase())) {
      code = encodeLetter(char);
    } else if (/[0-9]/.test(char)) {
      code = encodeNumber(char);
    }

    if (code !== null) {
      result += (lastWasCode ? LETTER_SEP : '') + code;
      lastWasCode = true;
    } else {
      /* tanda baca / karakter khusus tanpa aturan: tulis apa adanya */
      result += char;
      lastWasCode = false;
    }
  }

  return result;
}

/* Tulisan biasa → kode Kimakod. Spasi menjadi WORD_SEP. */
function encodeKimakod(text) {
  const input = String(text == null ? '' : text);
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map(encodeWord).filter(Boolean).join(' ' + WORD_SEP + ' ');
}

/* =========================================================
   8. DECODER
   ========================================================= */

function isSuperscript(char) {
  return typeof char === 'string' && char.length === 1 && SUP_CHARS.indexOf(char) !== -1;
}

/* Satu token kode → satu karakter hasil (huruf / digit). null bila bukan kode. */
function decodeToken(token) {
  if (Object.prototype.hasOwnProperty.call(DECODE_LETTER, token)) return DECODE_LETTER[token];
  if (Object.prototype.hasOwnProperty.call(DECODE_NUMBER, token)) return DECODE_NUMBER[token];
  return null;
}

/* Kode Kimakod → tulisan biasa. Membaca "•" sebagai batas huruf
   dan "|" sebagai batas kata; karakter lain dilewatkan apa adanya. */
function decodeKimakod(code) {
  const src = String(code == null ? '' : code);
  let result = '';
  let i = 0;

  while (i < src.length) {
    const char = src[i];

    /* pemisah: "•" dilewati, "|" menjadi spasi, spasi diabaikan */
    if (char === LETTER_SEP) { i += 1; continue; }
    if (char === WORD_SEP) { result += ' '; i += 1; continue; }
    if (/\s/.test(char)) { i += 1; continue; }

    /* konsonan: angka 1-9 diikuti superskrip, mis. "2²" */
    if (char >= '1' && char <= '9' && isSuperscript(src[i + 1])) {
      const letter = DECODE_LETTER[char + src[i + 1]];
      if (letter) { result += letter; i += 2; continue; }
    }

    /* angka 0 */
    if (char === '0') { result += '0'; i += 1; continue; }

    /* vokal: superskrip tunggal, mis. "¹" */
    if (isSuperscript(char)) { result += DECODE_LETTER[char]; i += 1; continue; }

    /* angka Romawi per digit, dibaca dengan longest match */
    let roman = null;
    for (const token of ROMAN_TOKENS) {
      if (src.startsWith(token, i)) { roman = token; break; }
    }
    if (roman) { result += DECODE_NUMBER[roman]; i += roman.length; continue; }

    /* tanda baca / karakter tak dikenal */
    result += char;
    i += 1;
  }

  return result;
}

/* =========================================================
   9. ANTARMUKA (DOM)
   ========================================================= */

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    try {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.top = '-1000px';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function flashButton(button, message) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.textContent = message;
  button.classList.add('is-done');
  clearTimeout(button._flashTimer);
  button._flashTimer = setTimeout(function () {
    button.textContent = button.dataset.label;
    button.classList.remove('is-done');
  }, 1400);
}

function setupTool(options) {
  const input = document.getElementById(options.input);
  const output = document.getElementById(options.output);
  const status = options.status ? document.getElementById(options.status) : null;
  const copyBtn = options.copy ? document.getElementById(options.copy) : null;
  const clearBtn = options.clear ? document.getElementById(options.clear) : null;
  const sampleBtn = options.sample ? document.getElementById(options.sample) : null;
  const samples = options.samples || [];
  let sampleIndex = 0;

  function update() {
    output.value = options.transform(input.value);

    if (status) {
      if (input.value.length === 0) {
        status.textContent = 'Hasil muncul otomatis saat kamu mengetik.';
      } else {
        status.textContent = input.value.length + ' karakter masuk · ' +
          output.value.length + ' karakter keluar';
      }
    }
  }

  input.addEventListener('input', update);

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!output.value) { flashButton(copyBtn, 'Kosong'); return; }
      copyText(output.value)
        .then(function () { flashButton(copyBtn, 'Tersalin ✓'); })
        .catch(function () { flashButton(copyBtn, 'Gagal'); });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      update();
      input.focus();
    });
  }

  if (sampleBtn && samples.length) {
    sampleBtn.addEventListener('click', function () {
      input.value = samples[sampleIndex % samples.length];
      sampleIndex += 1;
      update();
    });
  }

  update();
}

function init() {
  setupTool({
    input: 'plain-input',
    output: 'plain-output',
    status: 'plain-status',
    copy: 'plain-copy',
    clear: 'plain-clear',
    sample: 'plain-sample',
    transform: encodeKimakod,
    samples: [
      'Aku mau belajar Kimakod',
      'AKU MAU',
      'Nama saya Budi, umur 17 tahun.',
      'https://contoh.com/2026',
      '13581'
    ]
  });

  setupTool({
    input: 'code-input',
    output: 'code-output',
    status: 'code-status',
    copy: 'code-copy',
    clear: 'code-clear',
    sample: 'code-sample',
    transform: decodeKimakod,
    samples: [
      '¹•2²•⁵ | 4²•¹•⁵',
      '2²•³•4²•¹•2²•⁴•4¹',
      'I•III',
      'VIII•V',
      'I•III•V•VIII•I'
    ]
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
