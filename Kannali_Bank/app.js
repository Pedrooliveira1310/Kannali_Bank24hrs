/* ═══════════════════════════════════════════════════════
   KANALLI – BANCO 24H  |  app.js
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   CONFIGURAÇÃO DOS BANCOS
────────────────────────────────────────── */
const BANKS = {
  itau: {
    name:       'Itaú',
    theme:      'theme-itau',
    accent:     '#FF6600',
    logoPath:   'logos/Itau.png',
    logoText:   'ITAÚ',
    cardNumber: '4539 1488 0001 0001',   // número exibido no login ATM
    password:   '1234',
    balance:    5000.00,
    history:    []
  },
  santander: {
    name:       'Santander',
    theme:      'theme-santander',
    accent:     '#EC0000',
    logoPath:   'https://e7.pngegg.com/pngimages/512/702/png-clipart-santander-bank-santander-group-santander-securities-llc-bank-text-logo-thumbnail.png',
    logoText:   'SAN',
    cardNumber: '4539 1488 0002 0002',
    password:   '1234',
    balance:    3200.00,
    history:    []
  },
  nubank: {
    name:       'Nubank',
    theme:      'theme-nubank',
    accent:     '#8A05BE',
    logoPath:   'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/nubank-icon.png',
    logoText:   'NU',
    cardNumber: '4539 1488 0003 0003',
    password:   '1234',
    balance:    7800.50,
    history:    []
  },
  bradesco: {
    name:       'Bradesco',
    theme:      'theme-bradesco',
    accent:     '#CC092F',
    logoPath:   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT76Y8Kg3vkr8pHetdO3ELHzbU9OcaN-YtxQw&s',
    logoText:   'BRA',
    cardNumber: '4539 1488 0004 0004',
    password:   '1234',
    balance:    2100.75,
    history:    []
  },
  bb: {
    name:       'Banco do Brasil',
    theme:      'theme-bb',
    accent:     '#F7CD00',
    logoPath:   'https://play-lh.googleusercontent.com/1-aNhsSPNqiVluwNGZar_7F5PbQ4u1zteuJ1jumnArhe8bfYHHaVwu4aVOF5-NAmLaA=s256-rw',
    logoText:   'BB',
    cardNumber: '4539 1488 0005 0005',
    password:   '1234',
    balance:    9500.00,
    history:    []
  },
  caixa: {
    name:       'Caixa',
    theme:      'theme-caixa',
    accent:     '#1B72BA',
    logoPath:   'logos/app_caixa.png',
    logoText:   'CEF',
    cardNumber: '4539 1488 0006 0006',
    password:   '1234',
    balance:    4250.30,
    history:    []
  }
};

/* ──────────────────────────────────────────
   ESTADO DA APLICAÇÃO
────────────────────────────────────────── */
let currentBankKey = null;
let currentBank    = null;
let pinValue       = '';       // PIN digitado na etapa 2
let pinAttempts    = 0;        // Tentativas de senha incorreta
const MAX_PIN_ATTEMPTS = 3;    // Máximo antes de bloquear

/* ──────────────────────────────────────────
   UTILITÁRIOS
────────────────────────────────────────── */
const REGEX_NUMERO = /^\d+(\.\d+)?$/;

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function now() {
  return new Date().toLocaleString('pt-BR');
}

function addHistory(descricao, valor, tipo) {
  currentBank.history.push({
    descricao, valor, tipo,
    saldo: currentBank.balance,
    data: now()
  });
}

/* ──────────────────────────────────────────
   NAVEGAÇÃO ENTRE TELAS
────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ──────────────────────────────────────────
   TEMA
────────────────────────────────────────── */
function applyTheme(bankKey) {
  Object.values(BANKS).forEach(b => document.body.classList.remove(b.theme));
  if (bankKey) document.body.classList.add(BANKS[bankKey].theme);
}

/* ──────────────────────────────────────────
   LOGO (imagem ou texto fallback)
────────────────────────────────────────── */
function buildLogoEl(bank, size = 60, radius = 14) {
  if (bank.logoPath) {
    const img = document.createElement('img');
    img.src = bank.logoPath;
    img.alt = bank.name;
    img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;border-radius:${radius}px`;
    return img;
  }
  const div = document.createElement('div');
  div.textContent = bank.logoText;
  div.style.cssText = `
    width:${size}px;height:${size}px;border-radius:${radius}px;
    background:${bank.accent};display:flex;align-items:center;
    justify-content:center;font-family:Syne,sans-serif;
    font-weight:800;font-size:${Math.floor(size * 0.23)}px;
    color:#fff;letter-spacing:-0.5px;
  `;
  return div;
}

/* ──────────────────────────────────────────
   TELA 1 – CARDS DE BANCO
────────────────────────────────────────── */
function renderBankGrid() {
  const grid = document.getElementById('bankGrid');
  grid.innerHTML = '';
  Object.entries(BANKS).forEach(([key, bank]) => {
    const card = document.createElement('div');
    card.className = 'bank-card';
    card.style.setProperty('--card-accent', bank.accent);

    const logoWrap = document.createElement('div');
    logoWrap.className = 'bank-card-logo';
    logoWrap.style.background = 'none';
    logoWrap.appendChild(buildLogoEl(bank, 60, 14));

    const nameEl = document.createElement('span');
    nameEl.className = 'bank-card-name';
    nameEl.textContent = bank.name;

    card.appendChild(logoWrap);
    card.appendChild(nameEl);
    card.addEventListener('click', () => selectBank(key));
    grid.appendChild(card);
  });
}

/* ──────────────────────────────────────────
   SELECIONAR BANCO → ETAPA 1 DO LOGIN
────────────────────────────────────────── */
function selectBank(key) {
  currentBankKey = key;
  currentBank    = BANKS[key];
  applyTheme(key);
  pinValue = '';

  // Preenche logo/nome em AMBAS as etapas
  ['bankLogoSlot', 'bankLogoSlot2'].forEach(id => {
    const slot = document.getElementById(id);
    if (slot) { slot.innerHTML = ''; slot.appendChild(buildLogoEl(currentBank, 46, 11)); }
  });
  document.getElementById('bankNameLabel').textContent  = currentBank.name;
  document.getElementById('bankNameLabel2').textContent = currentBank.name;

  // Reset dos campos e tentativas
  document.getElementById('loginUser').value  = '';
  document.getElementById('loginPass').value  = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('pinError').textContent   = '';
  pinAttempts = 0;
  updatePinDisplay();

  // Info de demonstração
  document.getElementById('loginDemoInfo').innerHTML =
    `<strong>Cartão:</strong> ${currentBank.cardNumber}<br><strong>PIN:</strong> ${currentBank.password}`;

  // Garante que a etapa 1 está visível
  document.getElementById('step-card').style.display = '';
  document.getElementById('step-pin').style.display  = 'none';

  showScreen('screen-login');
}

/* ──────────────────────────────────────────
   FORMATAR NÚMERO DO CARTÃO (XXXX XXXX XXXX XXXX)
────────────────────────────────────────── */
document.getElementById('loginUser').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').substring(0, 16);
  this.value = v.replace(/(.{4})/g, '$1 ').trim();
});

document.getElementById('loginUser').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('btnNextStep').click();
});

/* ──────────────────────────────────────────
   ETAPA 1 → CONTINUAR (valida cartão)
────────────────────────────────────────── */
document.getElementById('btnNextStep').addEventListener('click', () => {
  const typed = document.getElementById('loginUser').value.trim();
  const errEl = document.getElementById('loginError');

  if (typed !== currentBank.cardNumber) {
    errEl.textContent = 'Número de cartão inválido. Tente novamente.';
    document.getElementById('loginUser').value = '';
    return;
  }

  errEl.textContent = '';
  pinValue = '';
  updatePinDisplay();
  document.getElementById('pinError').textContent = '';

  // Transição para etapa 2
  document.getElementById('step-card').style.display = 'none';
  document.getElementById('step-pin').style.display  = '';
});

/* ──────────────────────────────────────────
   TECLADO NUMÉRICO PIN
────────────────────────────────────────── */
function updatePinDisplay() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`pinDot${i}`);
    if (dot) dot.classList.toggle('filled', i < pinValue.length);
  }
}

document.getElementById('pinPad').addEventListener('click', (e) => {
  const btn = e.target.closest('.pin-key');
  if (!btn) return;

  if (btn.id === 'pinDel') {
    // Apagar último dígito
    pinValue = pinValue.slice(0, -1);
    updatePinDisplay();
    return;
  }

  if (btn.id === 'pinOk') {
    // Confirmar PIN
    validatePin();
    return;
  }

  const val = btn.dataset.val;
  if (val !== undefined && pinValue.length < 4) {
    pinValue += val;
    updatePinDisplay();
    // Auto-confirma ao preencher os 4 dígitos
    if (pinValue.length === 4) {
      setTimeout(validatePin, 350);
    }
  }
});

function validatePin() {
  const errEl = document.getElementById('pinError');

  // Bloquear se já excedeu tentativas
  if (pinAttempts >= MAX_PIN_ATTEMPTS) {
    showLockout();
    return;
  }

  if (pinValue.length < 4) {
    errEl.textContent = 'Digite os 4 dígitos da sua senha.';
    return;
  }

  if (pinValue !== currentBank.password) {
    pinAttempts++;
    pinValue = '';
    updatePinDisplay();

    const restantes = MAX_PIN_ATTEMPTS - pinAttempts;

    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      showLockout();
    } else {
      errEl.innerHTML = `Senha incorreta. <strong>${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}.</strong>`;
    }
    return;
  }

  // Senha correta — resetar contador e entrar
  pinAttempts = 0;
  errEl.textContent = '';
  goToDashboard();
}

function showLockout() {
  // Desabilitar todos os botões do teclado
  document.querySelectorAll('.pin-key').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.35';
    btn.style.cursor = 'not-allowed';
  });

  const errEl = document.getElementById('pinError');
  errEl.innerHTML = `
    <span style="color:#e53e3e;font-weight:600;">
      <i class="fa-solid fa-lock"></i> Cartão bloqueado após 3 tentativas incorretas.<br>
      <span style="font-size:0.85em;font-weight:400;">Atualize a página para desbloquear.</span>
    </span>
  `;

  // Shake na tela para feedback visual
  const card = document.querySelector('#step-pin .atm-card');
  if (card) {
    card.style.animation = 'none';
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 600);
  }
}

/* ──────────────────────────────────────────
   BOTÕES DE VOLTAR NO LOGIN
────────────────────────────────────────── */
document.getElementById('btnBackToSelect').addEventListener('click', () => {
  applyTheme(null);
  showScreen('screen-select');
});

document.getElementById('btnBackToCard').addEventListener('click', () => {
  pinValue = '';
  updatePinDisplay();
  document.getElementById('pinError').textContent = '';
  document.getElementById('step-pin').style.display  = 'none';
  document.getElementById('step-card').style.display = '';
});

/* ──────────────────────────────────────────
   DASHBOARD
────────────────────────────────────────── */
function goToDashboard() {
  // Injeta logo + nome do banco no header (sem logo Kanalli)
  const brandSlot = document.getElementById('dhBrandSlot');
  brandSlot.innerHTML = '';
  brandSlot.appendChild(buildLogoEl(currentBank, 40, 10));

  document.getElementById('dhBankName').textContent = currentBank.name.toUpperCase();
  updateBalance();
  document.getElementById('bcUser').textContent = `Cartão: •••• •••• •••• ${currentBank.cardNumber.slice(-4)}`;
  document.getElementById('statementSection').style.display = 'none';
  showScreen('screen-menu');
}

function updateBalance() {
  document.getElementById('bcAmount').textContent = formatBRL(currentBank.balance);
}

/* ── Logout ── */
document.getElementById('btnLogout').addEventListener('click', () => {
  applyTheme(null);
  currentBankKey = null;
  currentBank    = null;
  showScreen('screen-select');
});

/* ── Botões de operação ── */
document.querySelectorAll('.op-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const op = btn.dataset.op;
    switch (op) {
      case 'saldo':         opVerSaldo();       break;
      case 'saque':         opSaque();          break;
      case 'deposito':      opDeposito();       break;
      case 'transferencia': opTransferencia();  break;
      case 'senha':         opTrocarSenha();    break;
      case 'extrato':       opExtrato();        break;
      case 'pdf':           opGerarPDF();       break;
    }
  });
});

/* ──────────────────────────────────────────
   MODAL GENÉRICO
────────────────────────────────────────── */
function openModal({ title, body, showInput = false, inputPlaceholder = '0,00', onConfirm, onCancel }) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent  = body || '';
  document.getElementById('modalError').textContent = '';

  const inputWrap = document.getElementById('modalInputWrap');
  const input     = document.getElementById('modalInput');

  if (showInput) {
    inputWrap.style.display = 'block';
    input.value             = '';
    input.placeholder       = inputPlaceholder;
    setTimeout(() => input.focus(), 100);
  } else {
    inputWrap.style.display = 'none';
  }

  document.getElementById('modal').style.display = 'flex';

  const confirmBtn = document.getElementById('modalConfirm');
  const cancelBtn  = document.getElementById('modalCancel');
  const newConfirm = confirmBtn.cloneNode(true);
  const newCancel  = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newConfirm.addEventListener('click', () => { if (onConfirm) onConfirm(input.value); });
  newCancel.addEventListener('click',  () => { document.getElementById('modal').style.display = 'none'; if (onCancel) onCancel(); });
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }
function showModalError(msg) { document.getElementById('modalError').textContent = msg; }

/* ──────────────────────────────────────────
   OPERAÇÕES FINANCEIRAS
────────────────────────────────────────── */
function opVerSaldo() {
  openModal({
    title: 'Saldo Disponível',
    body:  `Seu saldo atual é: ${formatBRL(currentBank.balance)}`,
    onConfirm: closeModal, onCancel: closeModal
  });
}

function opSaque() {
  openModal({
    title: 'Saque',
    body:  `Saldo disponível: ${formatBRL(currentBank.balance)}`,
    showInput: true,
    inputPlaceholder: 'Valor do saque (ex: 150.00)',
    onCancel: closeModal,
    onConfirm: (raw) => {
      if (!REGEX_NUMERO.test(raw.trim()) || raw.trim() === '') { showModalError('Digite apenas números válidos (ex: 150.00).'); return; }
      const valor = Number(raw);
      if (valor <= 0) { showModalError('O valor deve ser maior que zero.'); return; }
      if (valor > currentBank.balance) { showModalError(`Saldo insuficiente. Disponível: ${formatBRL(currentBank.balance)}`); return; }
      currentBank.balance -= valor;
      addHistory('Saque', valor, 'debit');
      updateBalance();
      closeModal();
      openModal({ title: '✓ Saque realizado', body: `Valor sacado: ${formatBRL(valor)}\nNovo saldo: ${formatBRL(currentBank.balance)}`, onConfirm: closeModal, onCancel: closeModal });
    }
  });
}

function opDeposito() {
  openModal({
    title: 'Depósito',
    body:  `Saldo atual: ${formatBRL(currentBank.balance)}`,
    showInput: true,
    inputPlaceholder: 'Valor do depósito (ex: 200.00)',
    onCancel: closeModal,
    onConfirm: (raw) => {
      if (!REGEX_NUMERO.test(raw.trim()) || raw.trim() === '') { showModalError('Digite apenas números válidos (ex: 200.00).'); return; }
      const valor = Number(raw);
      if (valor <= 0) { showModalError('O valor deve ser maior que zero.'); return; }
      currentBank.balance += valor;
      addHistory('Depósito', valor, 'credit');
      updateBalance();
      closeModal();
      openModal({ title: '✓ Depósito realizado', body: `Valor depositado: ${formatBRL(valor)}\nNovo saldo: ${formatBRL(currentBank.balance)}`, onConfirm: closeModal, onCancel: closeModal });
    }
  });
}

function opTransferencia() {
  openModal({
    title: 'Transferência',
    body:  `Saldo disponível: ${formatBRL(currentBank.balance)}`,
    showInput: true,
    inputPlaceholder: 'Valor a transferir (ex: 300.00)',
    onCancel: closeModal,
    onConfirm: (raw) => {
      if (!REGEX_NUMERO.test(raw.trim()) || raw.trim() === '') { showModalError('Digite apenas números válidos (ex: 300.00).'); return; }
      const valor = Number(raw);
      if (valor <= 0) { showModalError('O valor deve ser maior que zero.'); return; }
      if (valor > currentBank.balance) { showModalError(`Saldo insuficiente. Disponível: ${formatBRL(currentBank.balance)}`); return; }
      currentBank.balance -= valor;
      addHistory('Transferência enviada', valor, 'debit');
      updateBalance();
      closeModal();
      openModal({ title: '✓ Transferência realizada', body: `Valor transferido: ${formatBRL(valor)}\nNovo saldo: ${formatBRL(currentBank.balance)}`, onConfirm: closeModal, onCancel: closeModal });
    }
  });
}

function opTrocarSenha() {
  document.getElementById('passOld').value     = '';
  document.getElementById('passNew').value     = '';
  document.getElementById('passConfirm').value = '';
  document.getElementById('passError').textContent = '';
  document.getElementById('modalPass').style.display = 'flex';
}

document.getElementById('passSave').addEventListener('click', () => {
  const old      = document.getElementById('passOld').value;
  const nova     = document.getElementById('passNew').value;
  const confirma = document.getElementById('passConfirm').value;
  const errEl    = document.getElementById('passError');

  if (old !== currentBank.password) { errEl.textContent = 'Senha atual incorreta.'; return; }
  if (nova.length < 4) { errEl.textContent = 'A nova senha deve ter pelo menos 4 caracteres.'; return; }
  if (nova !== confirma) { errEl.textContent = 'As senhas não coincidem.'; return; }

  currentBank.password = nova;
  addHistory('Troca de senha', 0, 'info');
  document.getElementById('modalPass').style.display = 'none';
  openModal({ title: '✓ Senha alterada', body: 'Sua senha foi atualizada com sucesso.', onConfirm: closeModal, onCancel: closeModal });
});

document.getElementById('passCancel').addEventListener('click', () => {
  document.getElementById('modalPass').style.display = 'none';
});

function opExtrato() {
  const section = document.getElementById('statementSection');
  const list    = document.getElementById('statementList');
  list.innerHTML = '';

  if (currentBank.history.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);justify-content:center">Nenhuma transação ainda.</li>';
  } else {
    [...currentBank.history].reverse().forEach(item => {
      const li = document.createElement('li');
      if (item.tipo === 'info') {
        li.innerHTML = `
          <div><div class="stmt-desc">${item.descricao}</div><div class="stmt-date">${item.data}</div></div>
          <div style="text-align:right"><div class="stmt-val" style="color:var(--text-muted)">—</div></div>
        `;
      } else {
        const sinal = item.tipo === 'credit' ? '+' : '-';
        li.innerHTML = `
          <div>
            <div class="stmt-desc">${item.descricao}</div>
            <div class="stmt-date">${item.data}</div>
          </div>
          <div style="text-align:right">
            <div class="stmt-val ${item.tipo}">${sinal} ${formatBRL(item.valor)}</div>
            <div class="stmt-bal">Saldo: ${formatBRL(item.saldo)}</div>
          </div>
        `;
      }
      list.appendChild(li);
    });
  }

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
}

async function opGerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);

  const linhas = currentBank.history.length === 0
    ? ['Nenhuma transação registrada.']
    : currentBank.history.map(item => {
        if (item.tipo === 'info') return `${item.data} | ${item.descricao}`;
        const sinal = item.tipo === 'credit' ? '+' : '-';
        return `${item.data} | ${item.descricao.padEnd(20)} | ${sinal}${formatBRL(item.valor).padStart(10)} | Saldo: ${formatBRL(item.saldo)}`;
      });

  const cabecalho = [
    '======================================================',
    `   KANALLI – Extrato Bancário  |  ${currentBank.name}`,
    '======================================================',
    `Cartão: •••• •••• •••• ${currentBank.cardNumber.slice(-4)}`,
    `Data/hora da emissão: ${now()}`,
    `Saldo atual: ${formatBRL(currentBank.balance)}`,
    '------------------------------------------------------'
  ];

  const rodape = [
    '------------------------------------------------------',
    'Gerado por Kanalli Tecnologia Financeira'
  ];

  const conteudoFinal = [...cabecalho, ...linhas, ...rodape];
  let y = 10;
  conteudoFinal.forEach(linha => {
    doc.text(linha, 10, y);
    y += 7;
    if (y > 280) { doc.addPage(); y = 10; }
  });

  doc.save(`extrato-kanalli-${currentBankKey}-${Date.now()}.pdf`);

  openModal({
    title: '✓ Extrato PDF gerado',
    body: 'O documento PDF foi salvo com sucesso.',
    onConfirm: closeModal, onCancel: closeModal
  });
}

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
renderBankGrid();
showScreen('screen-select');