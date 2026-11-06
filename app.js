/*
 * Loto APE — tirage du loto (numéros 1 à 90), phases de jeu et liste des lots.
 * Tout l'état est conservé dans le localStorage du navigateur.
 */
'use strict';

(() => {
  const MAX_NUMBER = 90;
  const HISTORY_SIZE = 8;

  // Clés localStorage (inchangées pour conserver les données existantes)
  const KEYS = {
    done: 'loto-done',
    title: 'loto-title',
    lots: 'loto-lots',
    lotIndex: 'loto-li',
    singleLot: 'loto-lot',
  };

  // ---------- Stockage ----------

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* stockage indisponible */ }
    },
    getJSON(key, fallback) {
      try {
        const raw = this.get(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    setJSON(key, value) {
      this.set(key, JSON.stringify(value));
    },
  };

  // ---------- Éléments du DOM ----------

  const $ = (id) => document.getElementById(id);
  const el = {
    title: $('title'),
    reset: $('reset'),
    phaseButtons: [...document.querySelectorAll('#phases button')],
    phase: $('phase'),
    num: $('num'),
    hist: $('hist'),
    grid: $('grid'),
    lotName: $('lotName'),
    lotPos: $('lotPos'),
    lotPrev: $('lotPrev'),
    lotNext: $('lotNext'),
    lotImport: $('lotImport'),
    dialog: $('dlg'),
    lotText: $('lotText'),
    lotFile: $('lotFile'),
    lotCancel: $('lotCancel'),
    lotOk: $('lotOk'),
  };

  // ---------- État ----------

  const state = {
    drawn: [],          // numéros tirés, dans l'ordre
    lots: [],           // liste des lots importée
    lotIndex: 0,        // lot affiché
  };

  const numberButtons = new Map(); // numéro -> bouton de la grille

  // ---------- Utilitaires ----------

  /** Rend un élément contenteditable « mono-ligne » : Entrée valide la saisie. */
  function singleLine(element) {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        element.blur();
      }
    });
  }

  // ---------- Tirage ----------

  function renderHistory() {
    el.hist.replaceChildren();
    if (!state.drawn.length) return;
    el.hist.append('Derniers : ');
    state.drawn.slice(-HISTORY_SIZE).reverse().forEach((n) => {
      const span = document.createElement('span');
      span.textContent = n;
      el.hist.append(span);
    });
  }

  function saveDrawn() {
    storage.setJSON(KEYS.done, state.drawn);
  }

  function drawNumber(n) {
    el.num.textContent = n;
    if (state.drawn.includes(n)) return;
    state.drawn.push(n);
    numberButtons.get(n).classList.add('done');
    saveDrawn();
    renderHistory();
  }

  function resetDraw() {
    if (!confirm('Remettre le tirage à zéro ?')) return;
    state.drawn = [];
    numberButtons.forEach((b) => b.classList.remove('done'));
    el.num.textContent = '?';
    saveDrawn();
    renderHistory();
  }

  function buildGrid() {
    const fragment = document.createDocumentFragment();
    for (let n = 1; n <= MAX_NUMBER; n++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'b' + n;
      button.textContent = n;
      button.addEventListener('click', () => drawNumber(n));
      numberButtons.set(n, button);
      fragment.append(button);
    }
    el.grid.append(fragment);
  }

  // ---------- Phases (1 ligne, 2 lignes, carton plein) ----------

  function togglePhase(button) {
    const wasActive = button.classList.contains('on');
    el.phaseButtons.forEach((b) => b.classList.remove('on'));
    el.phase.textContent = '';
    if (!wasActive) {
      button.classList.add('on');
      el.phase.textContent = button.dataset.p;
    }
  }

  // ---------- Lots ----------

  function saveLots() {
    storage.setJSON(KEYS.lots, state.lots);
    storage.set(KEYS.lotIndex, String(state.lotIndex));
  }

  function renderLot() {
    const { lots, lotIndex } = state;
    const hasLots = lots.length > 0;
    el.lotName.textContent = hasLots ? lots[lotIndex] : (storage.get(KEYS.singleLot) || '');
    el.lotPos.textContent = hasLots ? `Lot ${lotIndex + 1} / ${lots.length}` : '';
    el.lotPrev.disabled = !hasLots || lotIndex === 0;
    el.lotNext.disabled = !hasLots || lotIndex === lots.length - 1;
  }

  function moveLot(delta) {
    if (!state.lots.length) return;
    state.lotIndex = Math.min(state.lots.length - 1, Math.max(0, state.lotIndex + delta));
    saveLots();
    renderLot();
  }

  function editLotName() {
    const value = el.lotName.textContent;
    if (state.lots.length) {
      state.lots[state.lotIndex] = value;
      saveLots();
    } else {
      storage.set(KEYS.singleLot, value);
    }
  }

  /** Une ligne = un lot ; ignore les lignes vides et les guillemets CSV. */
  function parseLots(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  }

  function openImportDialog() {
    el.lotText.value = state.lots.join('\n');
    el.dialog.showModal();
  }

  function loadLotFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      el.lotText.value = String(reader.result).replace(/^﻿/, ''); // retire le BOM
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    state.lots = parseLots(el.lotText.value);
    state.lotIndex = 0;
    saveLots();
    renderLot();
    el.dialog.close();
  }

  // ---------- Restauration de l'état sauvegardé ----------

  function restore() {
    const title = storage.get(KEYS.title);
    if (title) el.title.textContent = title;

    const lots = storage.getJSON(KEYS.lots, []);
    state.lots = Array.isArray(lots) ? lots : [];
    const index = parseInt(storage.get(KEYS.lotIndex) || '0', 10) || 0;
    state.lotIndex = index >= 0 && index < state.lots.length ? index : 0;
    renderLot();

    const drawn = storage.getJSON(KEYS.done, []);
    (Array.isArray(drawn) ? drawn : []).forEach((n) => {
      if (!numberButtons.has(n) || state.drawn.includes(n)) return;
      state.drawn.push(n);
      numberButtons.get(n).classList.add('done');
    });
    renderHistory();
  }

  // ---------- Initialisation ----------

  function init() {
    buildGrid();

    el.phaseButtons.forEach((b) => b.addEventListener('click', () => togglePhase(b)));
    el.reset.addEventListener('click', resetDraw);

    el.title.addEventListener('input', () => storage.set(KEYS.title, el.title.textContent));
    singleLine(el.title);

    el.lotPrev.addEventListener('click', () => moveLot(-1));
    el.lotNext.addEventListener('click', () => moveLot(1));
    el.lotName.addEventListener('input', editLotName);
    singleLine(el.lotName);

    el.lotImport.addEventListener('click', openImportDialog);
    el.lotFile.addEventListener('change', loadLotFile);
    el.lotCancel.addEventListener('click', () => el.dialog.close());
    el.lotOk.addEventListener('click', confirmImport);

    restore();
  }

  init();
})();
