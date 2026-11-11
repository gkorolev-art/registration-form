const form = document.getElementById('signupForm');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');

const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const successMessage = document.getElementById('successMessage');

const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');

function validatePhone(value) {
  return /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(value);
}

function getPhoneDigits(value) {
  if (value.startsWith('+7')) return value.slice(2).replace(/\D/g, '').slice(0, 10);
  const digits = value.replace(/\D/g, '');
  return (digits.length === 11 && /^[78]/.test(digits) ? digits.slice(1) : digits).slice(0, 10);
}

function formatPhone(digits) {
  let result = '+7';
  if (digits.length > 0) result += '(' + digits.slice(0, 3);
  if (digits.length >= 3) result += ') ';
  if (digits.length > 3) result += digits.slice(3, 6);
  if (digits.length > 6) result += '-' + digits.slice(6, 8);
  if (digits.length > 8) result += '-' + digits.slice(8, 10);
  return result;
}

function updatePhoneInput() {
  const value = phoneInput.value;
  const cursor = phoneInput.selectionStart ?? value.length;
  const digitsBeforeCursor = value.slice(0, cursor).replace(/\D/g, '').length;
  const prefixDigits = value.startsWith('+7') || (value.replace(/\D/g, '').length === 11 && /^[78]/.test(value)) ? 1 : 0;
  const nationalDigitsBeforeCursor = Math.max(0, digitsBeforeCursor - prefixDigits);
  phoneInput.value = formatPhone(getPhoneDigits(value));

  let position = 2;
  let seen = 0;
  while (position < phoneInput.value.length && seen < nationalDigitsBeforeCursor) {
    if (/\d/.test(phoneInput.value[position])) seen++;
    position++;
  }
  while (position < phoneInput.value.length && /\D/.test(phoneInput.value[position])) position++;
  phoneInput.setSelectionRange(position, position);

  phoneError.textContent = phoneInput.value === '+7' || validatePhone(phoneInput.value)
    ? ''
    : 'Введите номер полностью в формате +7(000) 000-00-00';
  updateSubmitButtonState();
}

function getPasswordStrength(value) {
  if (value.length === 0) return 0;
  if (!isPasswordValid(value)) return 1;

  let score = 0;
  if (value.length >= 8) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[\p{P}\p{S}]/u.test(value)) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;

  if (score <= 1) return 1;
  if (score <= 2) return 2;
  return 3;
}

function isPasswordValid(value) {
  return value.length >= 8 && /[0-9\p{P}\p{S}]/u.test(value);
}

function doPasswordsMatch(password, confirm) {
  return password === confirm && confirm.length > 0;
}

function updateStrengthUI(value) {
  const strength = getPasswordStrength(value);
  const widths = ['0%', '33%', '66%', '100%'];
  const colors = ['#eaeaea', '#e5484d', '#f5a623', '#1a7f37'];
  const labels = ['', 'Слабый', 'Средний', 'Сильный'];

  strengthBar.style.width = widths[strength];
  strengthBar.style.background = colors[strength];
  strengthLabel.textContent = labels[strength];
}

function isFormValid() {
  const phoneOk = validatePhone(phoneInput.value);
  const passwordOk = isPasswordValid(passwordInput.value);
  const confirmOk = doPasswordsMatch(passwordInput.value, confirmInput.value);
  return phoneOk && passwordOk && confirmOk;
}

function updateSubmitButtonState() {
  submitBtn.disabled = !isFormValid();
  submitBtn.style.opacity = submitBtn.disabled ? '0.5' : '1';
  submitBtn.style.cursor = submitBtn.disabled ? 'not-allowed' : 'pointer';
}

phoneInput.addEventListener('input', updatePhoneInput);

// Удаляем ближайшую цифру вместе с разделителями, чтобы маска не мешала стиранию.
phoneInput.addEventListener('beforeinput', (event) => {
  if (!['deleteContentBackward', 'deleteContentForward'].includes(event.inputType)) return;
  const start = phoneInput.selectionStart;
  const end = phoneInput.selectionEnd;
  if (start !== end) return;

  event.preventDefault();
  const backwards = event.inputType === 'deleteContentBackward';
  let index = backwards ? start - 1 : start;
  while (index >= 2 && index < phoneInput.value.length && /\D/.test(phoneInput.value[index])) {
    index += backwards ? -1 : 1;
  }
  if (index < 2 || index >= phoneInput.value.length) return;
  phoneInput.setRangeText('', index, index + 1, 'start');
  updatePhoneInput();
});

phoneInput.addEventListener('paste', (event) => {
  const text = event.clipboardData?.getData('text');
  if (!text) return;
  const digits = text.replace(/\D/g, '');
  // Полный номер из буфера заменяет поле, включая уже установленный код страны.
  if ((digits.length === 11 && /^[78]/.test(digits)) || digits.length === 10) {
    event.preventDefault();
    phoneInput.value = formatPhone(getPhoneDigits(text));
    phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
    updatePhoneInput();
  }
});

passwordInput.addEventListener('input', () => {
  updateStrengthUI(passwordInput.value);

  if (passwordInput.value.length === 0) {
    passwordError.textContent = '';
  } else if (!isPasswordValid(passwordInput.value)) {
    passwordError.textContent = 'Пароль слишком слабый: минимум 8 символов, добавьте цифры или спецсимволы';
  } else {
    passwordError.textContent = '';
  }

  if (confirmInput.value.length > 0) {
    confirmError.textContent = doPasswordsMatch(passwordInput.value, confirmInput.value)
      ? ''
      : 'Пароли не совпадают';
  }

  updateSubmitButtonState();
});

confirmInput.addEventListener('input', () => {
  if (confirmInput.value.length === 0) {
    confirmError.textContent = '';
  } else if (!doPasswordsMatch(passwordInput.value, confirmInput.value)) {
    confirmError.textContent = 'Пароли не совпадают';
  } else {
    confirmError.textContent = '';
  }
  updateSubmitButtonState();
});

document.querySelectorAll('.password-toggle').forEach((button) => {
  const input = document.getElementById(button.getAttribute('aria-controls'));
  const fieldName = input === passwordInput ? 'пароль' : 'подтверждение пароля';

  button.addEventListener('click', () => {
    const showPassword = input.type === 'password';
    input.type = showPassword ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(showPassword));
    const label = `${showPassword ? 'Скрыть' : 'Показать'} ${fieldName}`;
    button.setAttribute('aria-label', label);
    button.title = label;
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isFormValid()) {
    successMessage.textContent = 'Регистрация прошла успешно!';
  }
});

updateSubmitButtonState();
