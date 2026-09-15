// script 0

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

// script 1





function downloadHTML() {
const htmlContent = document.documentElement.outerHTML;
const blob = new Blob(['<!DOCTYPE html>\n' + htmlContent], { type: 'text/html;charset=utf-8' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = '하이마트_견적시스템.html';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
}

const format = (num) => new Intl.NumberFormat('ko-KR').format(num);
const getVal = (id) => { const el = document.getElementById(id); return el && el.value ? parseInt(el.value) || 0 : 0; };
const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };

const HARDCODED_API_KEY = "";
function getApiKey() { try { const k = localStorage.getItem('gemini_api_key'); if(k && k.trim()!=="") return k.trim(); } catch(e) {} return HARDCODED_API_KEY || ""; }

const DEFAULT_HIPREED = { "75": { lump: 750000, payback: 23473, monthly: 33000 }, "150": { lump: 1500000, payback: 46946, monthly: 66000 }, "225": { lump: 2250000, payback: 70419, monthly: 99000 }, "300": { lump: 3000000, payback: 93892, monthly: 132000 } };
const DEFAULT_SUB_CARDS = {
"lotte": { tiers: [{v:0, t:"실적 없음 (0원)"}, {v:16000, t:"30만 실적 (-16,000원)"}, {v:19000, t:"70만 실적 (-19,000원)"}, {v:21000, t:"150만 실적 (-21,000원)"}] },
"woori": { tiers: [{v:0, t:"실적 없음 (0원)"}, {v:18000, t:"30만 실적 (-18,000원)"}, {v:20000, t:"70만 실적 (-20,000원)"}, {v:22000, t:"120만 실적 (-22,000원)"}] },
"samsung": { tiers: [{v:0, t:"실적 없음 (0원)"}, {v:13000, t:"30만 실적 (-13,000원)"}, {v:17000, t:"70만 실적 (-17,000원)"}, {v:22000, t:"150만 실적 (-22,000원)"}] },
"shinhan": { tiers: [{v:0, t:"실적 없음 (0원)"}, {v:10000, t:"50만 실적 (-10,000원)"}, {v:20000, t:"100만 실적 (-20,000원)"}, {v:30000, t:"200만 실적 (-30,000원)"}] },
"none": { tiers: [{v:0, t:"카드 혜택 없음 (0원)"}] }
};

let HIPREED = DEFAULT_HIPREED; let SUB_CARDS = DEFAULT_SUB_CARDS;
try { const h = localStorage.getItem('app_hipreed_rates'); if(h) HIPREED = JSON.parse(h); const s = localStorage.getItem('app_sub_cards'); if(s) SUB_CARDS = JSON.parse(s); } catch(e) {}
let currentAIMode = 'nonbuy'; let cachedAIMessages = { nonbuy: '', bought: '' };

function openAdminSettings() {
document.getElementById('settings-api-key').value = localStorage.getItem('gemini_api_key') || '';
document.getElementById('set-hipreed').value = JSON.stringify(HIPREED, null, 2); document.getElementById('set-cards').value = JSON.stringify(SUB_CARDS, null, 2);
document.getElementById('admin-settings-modal').classList.remove('hidden'); document.getElementById('admin-settings-modal').classList.add('flex');
}

function saveAdminSettings() {
try {
const newHipreed = JSON.parse(document.getElementById('set-hipreed').value); const newCards = JSON.parse(document.getElementById('set-cards').value);
localStorage.setItem('gemini_api_key', document.getElementById('settings-api-key').value.trim());
localStorage.setItem('app_hipreed_rates', JSON.stringify(newHipreed)); localStorage.setItem('app_sub_cards', JSON.stringify(newCards));
HIPREED = newHipreed; SUB_CARDS = newCards;
document.getElementById('admin-settings-modal').classList.add('hidden'); updateCardTiers(); calc();
showModal('저장 완료 ✅', '설정값이 완벽하게 적용되었습니다!', true, false);
} catch(e) { showModal('저장 실패 ❌', '입력하신 JSON 형식이 올바르지 않습니다.', true, false); }
}

function resetAdminSettings() {
localStorage.removeItem('app_hipreed_rates'); localStorage.removeItem('app_sub_cards'); HIPREED = DEFAULT_HIPREED; SUB_CARDS = DEFAULT_SUB_CARDS;
document.getElementById('set-hipreed').value = JSON.stringify(HIPREED, null, 2); document.getElementById('set-cards').value = JSON.stringify(SUB_CARDS, null, 2);
showModal('초기화 완료', '모든 요율이 기본값으로 복구되었습니다. [설정 저장하기]를 눌러주세요.', true, false);
}

// === 로컬 스토리지 데이터베이스 로직 ===
const FOLDER_DB_KEY = 'app_customer_folders';
let currentEditingFolderId = null;
let currentEditingQuoteId = null;

function getFolders() {
try { return JSON.parse(localStorage.getItem(FOLDER_DB_KEY)) || []; }
catch(e) { return []; }
}
function saveFolders(folders) {
localStorage.setItem(FOLDER_DB_KEY, JSON.stringify(folders));
}

// 라디오 버튼(저장방식) 선택 이벤트 연동
document.querySelectorAll('input[name="save-method"]').forEach(radio => {
radio.addEventListener('change', (e) => {
const selectEl = document.getElementById('save-folder-select');
if(e.target.value === 'existing_folder') {
selectEl.classList.remove('hidden');
} else {
selectEl.classList.add('hidden');
}
});
});

// 1. 견적 저장 모달 열기
function openSaveModal() {
const name = document.getElementById('i-name').value.trim() || '이름없음';
const phone = document.getElementById('i-c-phone').value.trim() || '연락처없음';
document.getElementById('save-c-name').value = `${name} (${phone})`;

const data = gatherQuotationData();
document.getElementById('save-quote-title').value = `${new Date().toLocaleDateString('ko-KR').substring(2)} ${data.itemSummary}`;

const folders = getFolders();
const selectEl = document.getElementById('save-folder-select');
selectEl.innerHTML = '';

let matchedFolderId = null;
folders.forEach(f => {
const opt = document.createElement('option');
opt.value = f.id;
opt.text = `${f.name} (${f.phone})`;
selectEl.appendChild(opt);
// 이름과 번호가 일치하는 기존 폴더가 있다면 우선 매칭
if (f.name === name && f.phone === phone) matchedFolderId = f.id;
});

// 초기화
document.querySelector('input[name="save-method"][value="new_folder"]').checked = true;
selectEl.classList.add('hidden');
document.getElementById('lbl-save-overwrite').classList.add('hidden');
document.getElementById('save-edit-notice').classList.add('hidden');

// 현재 수정 중인 견적이 있다면 덮어쓰기 옵션 활성화
if (currentEditingQuoteId && currentEditingFolderId) {
const f = folders.find(f => f.id === currentEditingFolderId);
const q = f ? f.quotes.find(q => q.id === currentEditingQuoteId) : null;
if(q) {
document.getElementById('save-edit-notice').classList.remove('hidden');
const overRadio = document.querySelector('input[name="save-method"][value="overwrite"]');
overRadio.checked = true;
document.getElementById('lbl-save-overwrite').classList.remove('hidden');
document.getElementById('lbl-save-overwrite').classList.add('flex');
}
} else if (folders.length > 0) {
// 기존 폴더가 있으면 기존 폴더 선택 라디오 활성화 및 자동 선택
if (matchedFolderId) {
document.querySelector('input[name="save-method"][value="existing_folder"]').checked = true;
selectEl.classList.remove('hidden');
selectEl.value = matchedFolderId;
}
}

if (folders.length === 0) {
document.querySelector('input[name="save-method"][value="existing_folder"]').disabled = true;
} else {
document.querySelector('input[name="save-method"][value="existing_folder"]').disabled = false;
}

document.getElementById('save-quote-modal').classList.remove('hidden');
document.getElementById('save-quote-modal').classList.add('flex');
}

// 2. 견적 실제 저장 실행
function executeSaveQuotation() {
const method = document.querySelector('input[name="save-method"]:checked').value;
const title = document.getElementById('save-quote-title').value.trim() || '저장된 견적';
const name = document.getElementById('i-name').value.trim() || '이름없음';
const phone = document.getElementById('i-c-phone').value.trim() || '연락처없음';

let folders = getFolders();
const quoteData = gatherQuotationData();
const newQuote = {
id: 'Q_' + Date.now(),
title: title,
date: new Date().toLocaleString('ko-KR'),
data: quoteData
};

if (method === 'overwrite' && currentEditingFolderId && currentEditingQuoteId) {
// 덮어쓰기 로직
const fIndex = folders.findIndex(f => f.id === currentEditingFolderId);
if(fIndex !== -1) {
const qIndex = folders[fIndex].quotes.findIndex(q => q.id === currentEditingQuoteId);
if(qIndex !== -1) {
folders[fIndex].quotes[qIndex].title = title;
folders[fIndex].quotes[qIndex].date = new Date().toLocaleString('ko-KR');
folders[fIndex].quotes[qIndex].data = quoteData;
}
}
} else if (method === 'existing_folder') {
// 기존 폴더에 추가
const targetFolderId = document.getElementById('save-folder-select').value;
const fIndex = folders.findIndex(f => f.id === targetFolderId);
if(fIndex !== -1) {
folders[fIndex].quotes.push(newQuote);
currentEditingFolderId = targetFolderId;
currentEditingQuoteId = newQuote.id;
}
} else {
// 새 폴더(고객) 생성 후 저장
const newFolder = {
id: 'F_' + Date.now(),
name: name,
phone: phone,
createdAt: new Date().toLocaleString('ko-KR'),
quotes: [newQuote]
};
folders.push(newFolder);
currentEditingFolderId = newFolder.id;
currentEditingQuoteId = newQuote.id;
}

saveFolders(folders); 


document.getElementById('save-quote-modal').classList.add('hidden');
showModal('저장 완료 ✅', '기기에 견적이 안전하게 저장되었습니다.', true, false);
}

function syncWithGoogleSheet(action, data) {
  const sheetUrl = localStorage.getItem("google_sheet_url");
  if (!sheetUrl || sheetUrl.trim() === "") return;
  
  // CORS 이슈 없이 백그라운드 전송
  fetch(sheetUrl, { 
    method: "POST", 
    mode: "no-cors", 
    headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    body: JSON.stringify({ action: action, data: data }) 
  }).catch(e => console.error(e));
}

let pendingImportData = [];
async function loadFromGoogleSheet() {
  const sheetUrl = localStorage.getItem("google_sheet_url");
  if (!sheetUrl || sheetUrl.trim() === "") {
    return showModal('주소 누락', '설정에서 구글 시트 연동 URL을 먼저 입력해주세요.', true, false);
  }
  
  showModal('동기화 중... 🔄', '구글 시트에서 데이터를 조회하고 있습니다.', false);
  try {
    const res = await fetch(sheetUrl);
    const data = await res.json();
    closeModal();
    if (Array.isArray(data) && data.length > 0) {
      pendingImportData = data;
      renderImportList(data);
      document.getElementById('import-quote-modal').classList.remove('hidden');
      document.getElementById('import-quote-modal').classList.add('flex');
    } else {
      showModal('알림', '구글 시트에 불러올 데이터가 없습니다.', true, false);
    }
  } catch(err) {
    closeModal();
    showModal('동기화 실패 ❌', '구글 시트에서 데이터를 조회할 수 없습니다. 권한(모든 사용자)이나 주소를 확인해주세요.<br><br>' + err.message, true, false);
  }
}

function renderImportList(cloudFolders) {
  const container = document.getElementById('import-list-container');
  container.innerHTML = cloudFolders.map((f, i) => `
    <label class="flex items-center p-3 bg-white rounded border border-gray-200 cursor-pointer hover:bg-blue-50 transition">
      <input type="checkbox" class="import-cb w-4 h-4 text-blue-600 mr-3" value="${i}" checked>
      <div class="flex-1">
        <div class="font-bold text-sm text-gray-900">${f.name} <span class="text-xs text-gray-500 font-normal ml-1">(${f.phone})</span></div>
        <div class="text-[11px] text-blue-600 mt-0.5">포함된 견적: ${f.quotes ? f.quotes.length : 0}개</div>
      </div>
    </label>
  `).join('');
  
  document.getElementById('import-confirm-btn').onclick = () => {
    const selectedIndices = Array.from(document.querySelectorAll('.import-cb:checked')).map(cb => parseInt(cb.value));
    if (selectedIndices.length === 0) return alert('불러올 항목을 선택해주세요.');
    
    const localFolders = getFolders();
    selectedIndices.forEach(idx => {
      const cloudFolder = pendingImportData[idx];
      const existingIdx = localFolders.findIndex(lf => lf.id === cloudFolder.id);
      if (existingIdx !== -1) {
        localFolders[existingIdx] = cloudFolder;
      } else {
        localFolders.push(cloudFolder);
      }
    });
    
    saveFolders(localFolders);
    renderFolders();
    document.getElementById('import-quote-modal').classList.add('hidden');
    document.getElementById('import-quote-modal').classList.remove('flex');
    showModal('불러오기 완료 ✅', '선택한 항목이 기기에 성공적으로 추가(병합)되었습니다.', true, false);
  };
} // 3. 폴더(고객) 관리 모달 열기 및 렌더링
function openManageModal() {
document.getElementById('folder-search-input').value = '';
renderFolders();
document.getElementById('manage-quote-modal').classList.remove('hidden');
document.getElementById('manage-quote-modal').classList.add('flex');
}

function renderFolders() {
const query = document.getElementById('folder-search-input').value.toLowerCase();
const folders = getFolders();
const container = document.getElementById('folder-list-container');
container.innerHTML = '';

const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(query) || f.phone.includes(query));

if (filteredFolders.length === 0) {
container.innerHTML = `<div class="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded">저장된 폴더(고객)가 없습니다.</div>`;
return;
}

// 폴더 역순(최신순) 정렬
filteredFolders.sort((a,b) => b.id.localeCompare(a.id)).forEach(f => {
const details = document.createElement('details');
details.className = "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden group";

// Summary (폴더 제목 영역)
const summary = document.createElement('summary');
summary.className = "flex justify-between items-center p-3 cursor-pointer bg-gray-50 group-open:bg-indigo-50 transition-colors";
summary.innerHTML = `<div class="flex items-center gap-2"> <span class="text-xl">📁</span> <div> <p class="font-bold text-gray-900 text-sm">${f.name} <span class="text-xs font-normal text-indigo-600 ml-1">(${f.quotes.length}건)</span></p> <p class="text-[11px] text-gray-500">${f.phone}</p>
</div>
</div>
<div class="flex items-center gap-2">
<button type="button" onclick="confirmDeleteFolder(event, '${f.id}')" class="text-[11px] bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 px-2 py-1 rounded">폴더삭제</button> <span class="text-gray-400 group-open:rotate-180 transition-transform">▼</span> </div>`;

// Content (하위 견적 리스트)
const content = document.createElement('div');
content.className = "p-2 bg-white border-t border-gray-100 space-y-2";

if(f.quotes.length === 0) {
content.innerHTML = `<p class="text-[11px] text-gray-400 text-center py-2">견적이 없습니다.</p>`;
} else {
// AI 요약 버튼 추가
if(f.quotes.length > 1) {
const aiBtnDiv = document.createElement('div');
aiBtnDiv.className = "flex justify-end px-1 pb-1";
aiBtnDiv.innerHTML = `<button type="button" onclick="analyzeFolderQuotes('${f.id}')" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-1 px-2.5 rounded shadow-sm text-[10px] flex items-center gap-1">✨ AI 견적 비교분석</button>`;
content.appendChild(aiBtnDiv);
}

f.quotes.slice().reverse().forEach(q => {
const qDiv = document.createElement('div');
qDiv.className = "flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-100";
qDiv.innerHTML = `<div class="flex-1 min-w-0 pr-2"> <p class="text-xs font-bold text-gray-800 truncate">${q.title}</p>
<p class="text-[10px] text-gray-500 mt-0.5">${q.date} · <span class="text-rose-600 font-semibold">${format(q.data.netPrice || q.data.finalPrice)}원</span></p>
</div>
<div class="flex gap-1">
<button type="button" onclick="loadQuotation('${f.id}', '${q.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded shadow text-[10px]">불러오기</button>
<button type="button" onclick="confirmDeleteQuote('${f.id}', '${q.id}')" class="bg-gray-400 hover:bg-rose-500 text-white font-bold py-1 px-2 rounded shadow text-[10px]">삭제</button>
</div>
`;
content.appendChild(qDiv);
});
}

details.appendChild(summary);
details.appendChild(content);
container.appendChild(details);
});
}

function loadQuotation(folderId, quoteId) {
const folders = getFolders();
const f = folders.find(x => x.id === folderId);
if(f) {
const q = f.quotes.find(x => x.id === quoteId);
if(q) {
applyQuotationData(q.data);
currentEditingFolderId = folderId;
currentEditingQuoteId = quoteId;
document.getElementById('manage-quote-modal').classList.add('hidden');
showModal('복원 완료! ✅', `견적이 성공적으로 화면에 세팅되었습니다.`, true, false);
}
}
}

function confirmDeleteFolder(event, folderId) {
event.preventDefault(); // 아코디언 토글 방지
showConfirmModal('폴더 삭제 ⚠️', '이 고객 폴더와 포함된 <b>모든 견적</b>이 기기에서 완전히 삭제됩니다.<br>계속하시겠습니까?', '삭제하기', 'bg-rose-600 hover:bg-rose-700', () => {
let folders = getFolders();
folders = folders.filter(f => f.id !== folderId);
saveFolders(folders); 


if (currentEditingFolderId === folderId) { currentEditingFolderId = null; currentEditingQuoteId = null; }
renderFolders();
document.getElementById('manage-quote-modal').classList.remove('hidden');
});
}

function confirmDeleteQuote(folderId, quoteId) {
showConfirmModal('견적 삭제 ⚠️', '선택한 견적을 기기에서 삭제하시겠습니까?', '삭제', 'bg-rose-500', () => {
let folders = getFolders();
const fIndex = folders.findIndex(f => f.id === folderId);
if(fIndex !== -1) {
folders[fIndex].quotes = folders[fIndex].quotes.filter(q => q.id !== quoteId);
saveFolders(folders); 


if (currentEditingQuoteId === quoteId) currentEditingQuoteId = null;
renderFolders();
}
document.getElementById('manage-quote-modal').classList.remove('hidden');
});
}

function gatherQuotationData() {
const type = document.querySelector('input[name="i-type"]:checked')?.value || "일반";
const name = document.getElementById('i-name').value || '';
const cPhone = document.getElementById('i-c-phone').value || '';
const phone = document.getElementById('i-phone').value || '031-767-1044';
const manager = document.getElementById('i-manager').value || '';
const no = document.getElementById('i-no').value || '';

const lumpItems = []; let itemSummary = '';
document.querySelectorAll('.l-name').forEach((el, i) => {
const n = el.value || ''; const m = document.querySelectorAll('.l-model')[i].value || ''; const qty = parseInt(document.querySelectorAll('.l-qty')[i].value) || 1; const p = parseInt(document.querySelectorAll('.l-price')[i].value) || 0;
if (n || p > 0) { lumpItems.push({ name: n, model: m, qty, price: p }); if (!itemSummary && n) itemSummary = n; }
});
if (lumpItems.length > 1) itemSummary += ` 외 ${lumpItems.length - 1}건`;

const lumpCard = document.getElementById('l-card')?.value || '미정(상담안함)'; const lumpDc = getVal('l-dc'); const lumpPtTot = getVal('l-pt-tot'); const lumpPtUse = getVal('l-pt-use'); const lumpCash = getVal('l-cash');
const lumpHp = Array.from(document.querySelectorAll('.hp-lump-row')).map(row => ({ val: row.querySelector('.hp-val').value, cnt: parseInt(row.querySelector('.hp-cnt').value) }));

const subItems = [];
document.querySelectorAll('.s-name').forEach((el, i) => {
const n = el.value || ''; const m = document.querySelectorAll('.s-model')[i].value || ''; const p = parseInt(document.querySelectorAll('.s-price')[i].value) || 0; const mo = document.querySelectorAll('.s-months')[i].value || '60';
if (n || p > 0) { subItems.push({ name: n, model: m, price: p, months: mo }); if (!itemSummary && n) itemSummary = n + '(구독)'; }
});

const subCardCorp = document.getElementById('s-card-corp')?.value || 'none'; const subCardTier = document.getElementById('s-card-tier')?.value || '0'; const subCash = getVal('s-cash');
const subHp = Array.from(document.querySelectorAll('.hp-sub-row')).map(row => ({ val: row.querySelector('.hp-val').value, cnt: parseInt(row.querySelector('.hp-cnt').value) }));

return {
id: 'Q-' + Date.now(), type, name, cPhone, phone, manager, no, itemSummary: itemSummary || '가전 견적',
totalPrice: parseInt(document.getElementById('s1-total')?.innerText.replace(/[^0-9]/g, '') || 0),payPrice: parseInt(document.getElementById('s1-pay')?.innerText.replace(/[^0-9]/g, '') || 0),finalPrice: parseInt(document.getElementById('s1-pay')?.innerText.replace(/[^0-9]/g, '') || 0),netPrice: parseInt(document.getElementById('s1-final')?.innerText.replace(/[^0-9]/g, '') || 0),lumpSum: parseInt(document.getElementById('s1-total')?.innerText.replace(/[^0-9]/g, '') || 0),subSum: parseInt(document.getElementById('s1-total')?.innerText.replace(/[^0-9]/g, '') || 0),
lumpItems, lumpCard, lumpDc, lumpPtTot, lumpPtUse, lumpCash, lumpHp, subItems, subCardCorp, subCardTier, subCash, subHp
};
}

function applyQuotationData(data) {
if (!data) return;
const typeRadio = document.querySelector(`input[name="i-type"][value="${data.type || '일반'}"]`); if (typeRadio) typeRadio.checked = true;
document.getElementById('i-name').value = data.name || ''; document.getElementById('i-c-phone').value = data.cPhone || '';
document.getElementById('i-phone').value = data.phone || '031-767-1044';
document.getElementById('i-manager').value = data.manager || ''; document.getElementById('i-no').value = data.no || '';

document.getElementById('lump-inputs').innerHTML = '';
if (data.lumpItems && data.lumpItems.length > 0) data.lumpItems.forEach(i => addLumpRow(i.name, i.model, i.price, i.qty)); else addLumpRow();

document.getElementById('l-card').value = data.lumpCard || '미정(상담안함)';
['l-dc', 'l-pt-tot', 'l-pt-use', 'l-cash'].forEach(id => { document.getElementById(id).value = data[id.replace('-','').replace('-','')] || data[id.replace(/-/g,'').replace('l','lump')] || (data.lumpDc!==undefined?data[id.replace('l-','lump').replace(/-([a-z])/g, (g) => g[1].toUpperCase())]:''); });
document.getElementById('l-dc').value = data.lumpDc || ''; document.getElementById('l-pt-tot').value = data.lumpPtTot || ''; document.getElementById('l-pt-use').value = data.lumpPtUse || ''; document.getElementById('l-cash').value = data.lumpCash || '';

document.getElementById('lump-hp-container').innerHTML = '';
if (data.lumpHp) data.lumpHp.forEach(hp => { addHpRow('lump'); const r = document.getElementById('lump-hp-container').lastElementChild; if(r){ r.querySelector('.hp-val').value = hp.val; r.querySelector('.hp-cnt').value = hp.cnt; } });

document.getElementById('sub-inputs').innerHTML = '';
if (data.subItems && data.subItems.length > 0) data.subItems.forEach(i => addSubRow(i.name, i.model, i.price, i.months)); else addSubRow();

document.getElementById('s-card-corp').value = data.subCardCorp || 'none'; updateCardTiers(); document.getElementById('s-card-tier').value = data.subCardTier || '0'; document.getElementById('s-cash').value = data.subCash || '';

document.getElementById('sub-hp-container').innerHTML = '';
if (data.subHp) data.subHp.forEach(hp => { addHpRow('sub'); const r = document.getElementById('sub-hp-container').lastElementChild; if(r){ r.querySelector('.hp-val').value = hp.val; r.querySelector('.hp-cnt').value = hp.cnt; } });
calc();
}

function showModal(title, desc, showBtn = false, showSpinner = true) {
document.getElementById('modal-title').innerHTML = title; document.getElementById('modal-desc').innerHTML = desc;
const btnContainer = document.getElementById('modal-btn-container');
if(showBtn) {
btnContainer.classList.remove('hidden');
btnContainer.innerHTML = `<button onclick="closeModal()" class="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-colors text-xs shadow">확인</button>`;
} else { btnContainer.classList.add('hidden'); }
document.getElementById('modal-spinner').style.display = showSpinner ? 'block' : 'none';
document.getElementById('custom-modal').classList.remove('hidden'); document.getElementById('custom-modal').classList.add('flex');
}

function showConfirmModal(title, desc, confirmText, confirmColor, onConfirm) {
document.getElementById('modal-title').innerHTML = title; document.getElementById('modal-desc').innerHTML = desc;
const btnContainer = document.getElementById('modal-btn-container');
btnContainer.classList.remove('hidden');
btnContainer.innerHTML = `<button onclick="closeModal();" class="w-1/2 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg text-xs transition">취소</button> <button id="confirm-action-btn" class="w-1/2 py-2.5 ${confirmColor} text-white font-bold rounded-lg text-xs transition shadow">${confirmText}</button>`;
document.getElementById('confirm-action-btn').onclick = () => { closeModal(); onConfirm(); };
document.getElementById('modal-spinner').style.display = 'none';
document.getElementById('custom-modal').classList.remove('hidden'); document.getElementById('custom-modal').classList.add('flex');
}

function closeModal() { document.getElementById('custom-modal').classList.add('hidden'); document.getElementById('custom-modal').classList.remove('flex'); }

function switchInputTab(mode) {
    const lBtn = document.getElementById("input-tab-lump");
    const sBtn = document.getElementById("input-tab-sub");
    const lSec = document.getElementById("input-lump-sec");
    const sSec = document.getElementById("input-sub-sec");
    if (mode === "lump") {
        lSec.classList.remove("hidden"); sSec.classList.add("hidden");
        lBtn.className = "flex-1 py-2.5 text-sm font-bold bg-rose-600 text-white rounded-xl shadow transition-colors";
        sBtn.className = "flex-1 py-2.5 text-sm font-bold bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors";
        showSheet('sheet1', document.querySelector('button[onclick*="sheet1"]'));
    } else {
        lSec.classList.add("hidden"); sSec.classList.remove("hidden");
        sBtn.className = "flex-1 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow transition-colors";
        lBtn.className = "flex-1 py-2.5 text-sm font-bold bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors";
        showSheet('sheet2', document.querySelector('button[onclick*="sheet2"]'));
    }
}

function showSheet(sheetId, btn) {
document.querySelectorAll('.sheet-view').forEach(el => el.classList.remove('active')); document.querySelectorAll('.sheet-btn').forEach(el => el.classList.remove('active'));
document.getElementById(sheetId).classList.add('active'); if (btn) btn.classList.add('active');
}

// [수정됨] 모바일에서 완벽한 비율로 한줄 정렬을 보장하기 위해 Grid 속성을 도입하고 X 버튼을 Absolute 처리

function addLumpBenefitRow() {
const div = document.createElement('div');
div.className = "flex gap-1 mb-1 items-center benefit-lump-row";
div.innerHTML = `
<select class="input-box w-[30%] text-[10px] b-type" onchange="calc()">
<option value="cashback">추가 캐시백</option>
<option value="gift">상품권</option>
<option value="naver">네이버포인트 적립</option>
<option value="discount">추가즉시할인</option>
</select>
<input type="text" class="input-box w-[35%] text-[10px] b-desc" placeholder="내용 (선택)" oninput="calc()">
<input type="number" class="input-box w-[25%] text-xs text-right b-val" placeholder="0" oninput="calc()">
<button type="button" onclick="this.parentElement.remove(); calc();" class="w-[10%] bg-gray-200 text-gray-500 px-2 py-1.5 rounded text-xs hover:bg-gray-300">X</button>
`;
document.getElementById('lump-benefit-container').appendChild(div);
}
function addLumpRow(name='', model='', price='', qty=1) {
const div = document.createElement('div'); div.className = 'relative grid grid-cols-12 gap-1 items-center bg-white p-1.5 rounded border pr-6 mb-1.5';
div.innerHTML = `<input type="text" class="col-span-3 input-box px-1.5 py-1.5 text-xs l-name" placeholder="품목" value="${name}"><div class="col-span-4 flex gap-0.5"><input type="text" class="input-box px-1 py-1.5 text-xs l-model w-full" placeholder="모델명" value="${model}"><button type="button" onclick="summarizeModel(this.previousElementSibling.value, this.parentElement.previousElementSibling.value)" class="bg-indigo-100 text-indigo-700 px-1 text-[10px] rounded flex-shrink-0" title="스펙 요약">💡</button></div><input type="number" class="col-span-2 input-box px-1.5 py-1.5 text-xs l-qty" placeholder="수량" value="${qty}"><input type="number" class="col-span-3 input-box px-1.5 py-1.5 text-xs l-price" placeholder="금액" value="${price}"><button type="button" onclick="this.parentElement.remove(); calc();" class="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center text-rose-500 font-bold hover:bg-rose-50 rounded-r">X</button>`;
document.getElementById('lump-inputs').appendChild(div); calc();
}

// [수정됨] 구독품목 역시 위와 동일한 Grid 방식으로 모바일 화면 깨짐 방지
function addSubRow(name='', model='', price='', months='60') {
const div = document.createElement('div'); div.className = 'relative grid grid-cols-12 gap-1 items-center bg-white p-1.5 rounded border pr-6 mb-1.5';
div.innerHTML = `<input type="text" class="col-span-3 input-box px-1.5 py-1.5 text-xs s-name" placeholder="품목" value="${name}"><input type="text" class="col-span-4 input-box px-1.5 py-1.5 text-xs s-model" placeholder="모델명" value="${model}"><input type="number" class="col-span-3 input-box px-1.5 py-1.5 text-xs s-price" placeholder="금액" value="${price}"><select class="col-span-2 input-box px-0.5 py-1.5 text-[11px] s-months" onchange="calc()"><option value="36" ${months == '36' ? 'selected' : ''}>36개월</option><option value="60" ${months == '60' ? 'selected' : ''}>60개월</option></select><button type="button" onclick="this.parentElement.remove(); calc();" class="absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center text-blue-500 font-bold hover:bg-blue-50 rounded-r">X</button>`;
document.getElementById('sub-inputs').appendChild(div); calc();
}

function addHpRow(type) {
let currentCnt = 0; document.querySelectorAll(`.hp-${type}-row .hp-cnt`).forEach(el => currentCnt += parseInt(el.value)); if(currentCnt >= 6) return showModal('알림', '최대 6건까지만 결합 가능합니다.', true, false); const div = document.createElement('div'); div.className = `hp-${type}-row flex gap-2 mb-1 items-center`;
div.innerHTML = `<select class="input-box w-1/2 hp-val text-xs"><option value="75">하이프리드 75 (75만지원)</option><option value="150">하이프리드 150 (150만지원)</option><option value="225">하이프리드 225 (225만지원)</option><option value="300" selected>하이프리드 300 (300만지원)</option></select><select class="input-box w-1/3 hp-cnt text-xs"><option value="1">1건</option><option value="2">2건</option><option value="3">3건</option><option value="4">4건</option><option value="5">5건</option><option value="6">6건</option></select><button type="button" onclick="this.parentElement.remove(); calc();" class="text-gray-500 px-2 font-bold bg-white border rounded h-full">X</button>`;
document.getElementById(`${type}-hp-container`).appendChild(div); calc();
}

function getAutoCashback(amount) {
if(amount >= 20000000) return 1000000; if(amount >= 15000000) return 750000; if(amount >= 12000000) return 600000;
if(amount >= 10000000) return 500000; if(amount >= 7000000) return 350000; if(amount >= 5000000) return 250000; if(amount >= 3000000) return 150000; return 0;
}

window.onload = () => { addLumpRow(); addSubRow(); updateCardTiers(); calc(); };

function calc() {
const typeText = document.querySelector('input[name="i-type"]:checked')?.value || "일반";
const cName = document.getElementById('i-name').value ? `[${typeText}] ${document.getElementById('i-name').value} 고객님` : `[${typeText}] 고객님`;
const cPhone = document.getElementById('i-c-phone').value || '';
const cMan = document.getElementById('i-manager').value || '-';
const cNo = document.getElementById('i-no').value || '-';

['s1','s2'].forEach(p => {
setTxt(`${p}-name`, cName); setTxt(`${p}-manager`, cMan); setTxt(`${p}-no`, cNo); setTxt(`${p}-phone`, cPhone ? `${cPhone}` : '');
});

const lCardText = document.getElementById('l-card')?.value; setTxt('s1-card', lCardText && lCardText !== '미정(상담안함)' ? `[${lCardText}]` : ''); const sCardCorpObj = document.getElementById('s-card-corp'); setTxt('s2-card-name', sCardCorpObj && sCardCorpObj.value !== 'none' ? `[${sCardCorpObj.options[sCardCorpObj.selectedIndex].text} 제휴]` : '');

let lSum = 0; let s1Tbody = '';
document.querySelectorAll('.l-name').forEach((el, i) => {
const n = el.value || '-'; const m = document.querySelectorAll('.l-model')[i].value || '-'; const qty = parseInt(document.querySelectorAll('.l-qty')[i].value) || 1; const p = parseInt(document.querySelectorAll('.l-price')[i].value) || 0;
lSum += p * qty;
if(n !== '-' || p > 0) s1Tbody += `<tr><td>${n}</td><td class="model-cell">${m}</td><td class="text-center">${qty}</td><td class="text-right">${format(p * qty)} 원</td></tr>`;
});
document.getElementById('s1-tbody').innerHTML = s1Tbody;

const lDc = getVal('l-dc'); const lPtUse = getVal('l-pt-use'); const lPtTot = getVal('l-pt-tot');
let lHpVal = 0; let lHpMonth = 0; let lHpCnt = 0;
document.querySelectorAll('.hp-lump-row').forEach(row => {
const v = row.querySelector('.hp-val').value; const c = parseInt(row.querySelector('.hp-cnt').value);
if(HIPREED[v]) { lHpVal += HIPREED[v].lump * c; lHpMonth += HIPREED[v].monthly * c; lHpCnt += c; }
});


    let extraDc = 0;
    let extraCash = 0;
    let benefitRows = [];

    document.querySelectorAll('.benefit-lump-row').forEach(row => {
        const type = row.querySelector('.b-type').value;
        const desc = row.querySelector('.b-desc').value || (type==='cashback'?'추가 캐시백':type==='gift'?'상품권':type==='naver'?'네이버포인트':'추가 즉시할인');
        const val = parseInt(row.querySelector('.b-val').value) || 0;
        if(val > 0) {
            if(type === 'discount') {
                extraDc += val;
                benefitRows.push({type: 'dc', desc, val});
            } else if(type === 'cashback') {
                extraCash += val;
                benefitRows.push({type: 'cash', desc, val});
            } else if(type === 'gift') {
                extraCash += val;
                benefitRows.push({type: 'gift', desc, val});
            } else if(type === 'naver') {
                extraCash += val;
                benefitRows.push({type: 'naver', desc, val});
            }
        }
    });

    const lDcTotal = lDc + extraDc;
    const lPay = Math.max(0, lSum - lDcTotal - lPtUse - lHpVal);
    const lAutoCash = (lCardText === '미정(상담안함)') ? 0 : getAutoCashback(lPay); 
    const lExtraCashTotal = getVal('l-cash') + extraCash; 
    const lNet = Math.max(0, lPay - lAutoCash - lExtraCashTotal);
    
    // Sheet 1 - Pay Table
    let s1PayRows = `<tr><td class="bg-gray-50 font-bold w-2/3">총 행사가 합계</td><td class="text-right font-bold text-gray-900">${format(lSum)} 원</td></tr>`;
    if(lDc > 0) s1PayRows += `<tr><td class="bg-gray-50 text-gray-800">(-) 기본 즉시 할인액</td><td class="text-right text-rose-600">- ${format(lDc)} 원</td></tr>`;
    benefitRows.filter(b=>b.type==='dc').forEach(b => {
        s1PayRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [추가할인] ${b.desc}</td><td class="text-right text-rose-600">- ${format(b.val)} 원</td></tr>`;
    });
    if(lPtUse > 0) s1PayRows += `<tr><td class="bg-gray-50 text-gray-800">(-) 포인트 즉시 사용</td><td class="text-right text-rose-600">- ${format(lPtUse)} 원</td></tr>`;
    if(lHpVal > 0) s1PayRows += `<tr><td class="bg-gray-50 font-bold text-rose-700">(-) 하이프리드 결합 지원금</td><td class="text-right text-rose-600 font-bold">- ${format(lHpVal)} 원</td></tr>`;
    s1PayRows += `<tr><td class="bg-gray-200 font-extrabold text-gray-900">최종 결제 금액 (실결제 기준)</td><td class="text-right font-extrabold text-base text-gray-900">${format(lPay)} 원</td></tr>`;
    
    document.getElementById('s1-pay-tbody').innerHTML = s1PayRows;

    // Sheet 1 - Cash Table
    let s1CashRows = '';
    if(lAutoCash > 0) s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) 결제금액별 자동 캐시백</td><td class="text-right text-blue-600">- ${format(lAutoCash)} 원</td></tr>`;
    if(getVal('l-cash') > 0) s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) 기본 추가 캐시백</td><td class="text-right text-blue-600">- ${format(getVal('l-cash'))} 원</td></tr>`;
    benefitRows.filter(b=>b.type==='cash').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [캐시백] ${b.desc}</td><td class="text-right text-blue-600">- ${format(b.val)} 원</td></tr>`;
    });
    benefitRows.filter(b=>b.type==='gift').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [상품권] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td></tr>`;
    });
    benefitRows.filter(b=>b.type==='naver').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [네이버포인트] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td></tr>`;
    });
    s1CashRows += `<tr class="border-t-2 border-gray-400"><td class="bg-gray-100 font-extrabold text-gray-900">★ 고객 체감 순비용</td><td class="text-right font-extrabold text-xl text-rose-700">${format(lNet)} 원</td></tr>`;
    
    document.getElementById('s1-cash-tbody').innerHTML = s1CashRows;

    setTxt('s1-pt-tot-view', format(lPtTot)); setTxt('s1-pt-remain', format(Math.max(0, lPtTot - lPtUse)));

const lhpPreview = document.getElementById('lump-hp-preview'); if(lhpPreview) lhpPreview.innerText = `${format(lHpMonth * 150)} 원 (${lHpCnt}건)`;

let sMonthSum = 0; let sMonth36 = 0; let sMonth60 = 0; let sContract = 0; let s2Tbody = ''; let has60Month = false;
document.querySelectorAll('.s-name').forEach((el, i) => {
const n = el.value || '-'; const m = document.querySelectorAll('.s-model')[i].value || '-'; const p = parseInt(document.querySelectorAll('.s-price')[i].value) || 0; const mo = parseInt(document.querySelectorAll('.s-months')[i].value) || 60;
sMonthSum += p; if (mo === 36) sMonth36 += p; if (mo === 60) { sMonth60 += p; has60Month = true; } sContract += p * mo;
if(n !== '-' || p > 0) s2Tbody += `<tr><td>${n}</td><td class="model-cell">${m}</td><td class="text-center">${mo}개월</td><td class="text-right">${format(p)} 원</td><td class="text-right">${format(p*mo)} 원</td></tr>`;
});
document.getElementById('s2-tbody').innerHTML = s2Tbody;

const cardCorpSelect = document.getElementById('s-card-corp');
if (has60Month) {
Array.from(cardCorpSelect.options).forEach(opt => { opt.disabled = (opt.value !== 'none' && opt.value !== 'lotte'); });
if (cardCorpSelect.value !== 'none' && cardCorpSelect.value !== 'lotte') { cardCorpSelect.value = 'none'; updateCardTiers(); }
} else { Array.from(cardCorpSelect.options).forEach(opt => { opt.disabled = false; }); }

const sCardVal = parseInt(document.getElementById('s-card-tier')?.value) || 0; const sCardCorp = document.getElementById('s-card-corp')?.value || 'none'; const cardDuration = (sCardCorp === 'lotte' && has60Month) ? 60 : 36;
let sHpVal = 0; let sHpMonth = 0; let sHpCnt = 0;
document.querySelectorAll('.hp-sub-row').forEach(row => {
const v = row.querySelector('.hp-val').value; const c = parseInt(row.querySelector('.hp-cnt').value);
if(HIPREED[v]) { sHpVal += HIPREED[v].payback * c; sHpMonth += HIPREED[v].monthly * c; sHpCnt += c; }
});

const sAutoCash = (sCardCorp !== 'lotte' && sCardCorp !== 'woori' && sCardCorp !== 'none') ? getAutoCashback(sContract) : 0; const sExtraCash = getVal('s-cash');
const isBillingDiscount = (sCardCorp === 'woori' || sCardCorp === 'samsung');
const s2CardLabel = document.getElementById('s2-card-label');
if (s2CardLabel) s2CardLabel.innerText = `(-) 제휴카드 ${isBillingDiscount ? '청구할인' : '캐시백'} (${cardDuration}개월간)`;
const s3CardLabel = document.getElementById('s3-card-label');
if (s3CardLabel) s3CardLabel.innerText = `(-) 제휴카드 혜택 (${isBillingDiscount ? '청구할인' : '캐시백'})`;

const p1_billed = isBillingDiscount ? Math.max(0, sMonthSum - sCardVal) : sMonthSum;
const p1_cashback = isBillingDiscount ? sHpVal : (sCardVal + sHpVal);
const p1_raw = sMonthSum - sCardVal - sHpVal;

const p2_billed = isBillingDiscount ? Math.max(0, sMonthSum - sCardVal) : sMonthSum;
const p2_cashback = isBillingDiscount ? 0 : sCardVal;
const p2_raw = sMonthSum - sCardVal;

const p3_cardVal = (cardDuration === 60) ? sCardVal : 0;
const p3_billed = isBillingDiscount ? Math.max(0, sMonth60 - p3_cardVal) : sMonth60;
const p3_cashback = isBillingDiscount ? 0 : p3_cardVal;
const p3_raw = sMonth60 - p3_cardVal;

const sNetTotal_raw = sContract - (sCardVal * cardDuration) - (sHpVal * 35) - sAutoCash - sExtraCash;
const sNetTotal = Math.max(0, sNetTotal_raw);

setTxt('s2-month', format(sMonthSum) + ' 원'); setTxt('s2-card', sCardVal > 0 ? `월 -${format(sCardVal)} 원 (${cardDuration}개월)` : '0 원'); setTxt('s2-hp', sHpVal > 0 ? '월 -' + format(sHpVal) + ' 원 (35회)' : '0 원');

const formatMonthly = (billed, cashback, net) => {
    if (cashback > 0 || billed !== net) {
        let netTxt = `월 ${format(Math.max(0, net))} 원`;
        if (net < 0) netTxt = `월 0 원 <span class="text-[11px] block text-rose-500 font-normal mt-0.5">(매월 ${format(Math.abs(net))}원 혜택)</span>`;
        return `<div class="text-[11px] text-gray-500 font-normal leading-tight">실청구액: 월 ${format(billed)}원</div>
                <div class="text-[11px] text-blue-500 font-normal leading-tight pb-0.5">캐시백 혜택: 월 ${format(cashback)}원</div>
                <div class="text-base">${netTxt}</div>`;
    } else {
        let netTxt = `월 ${format(Math.max(0, net))} 원`;
        if (net < 0) netTxt = `월 0 원 <span class="text-[11px] block text-rose-500 font-normal mt-0.5">(매월 ${format(Math.abs(net))}원 혜택)</span>`;
        return `<div class="text-base">${netTxt}</div>`;
    }
};

const p2Title = document.getElementById('s2-p2-title');
if (p2Title) p2Title.innerText = sHpCnt > 0 ? "② 36개월 차 (상조 페이백 종료)" : "② 36개월 차";

const elP1 = document.getElementById('s2-p1'); if(elP1) elP1.innerHTML = formatMonthly(p1_billed, p1_cashback, p1_raw);
const elP2 = document.getElementById('s2-p2'); if(elP2) elP2.innerHTML = formatMonthly(p2_billed, p2_cashback, p2_raw);
const rowP3 = document.getElementById('row-p3');
if (sMonth60 > 0) {
    if(rowP3) rowP3.classList.remove('hidden');
    const elP3 = document.getElementById('s2-p3'); if(elP3) elP3.innerHTML = formatMonthly(p3_billed, p3_cashback, p3_raw);
} else {
    if(rowP3) rowP3.classList.add('hidden');
}

let final_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) final_sub_txt = `0 원 (총 ${format(Math.abs(sNetTotal_raw))} 원 혜택)`;
setTxt('s2-contract', format(sContract) + ' 원'); setTxt('s2-auto-cash', sAutoCash > 0 ? '- ' + format(sAutoCash) + ' 원' : '0 원'); setTxt('s2-extra-cash', sExtraCash > 0 ? '- ' + format(sExtraCash) + ' 원' : '0 원'); setTxt('s2-final-total', final_sub_txt);
const shpPreview = document.getElementById('sub-hp-preview'); if(shpPreview) shpPreview.innerText = `${format(sHpMonth * 150)} 원 (${sHpCnt}건)`;

setTxt('s3-t-lump', format(lSum) + ' 원'); setTxt('s3-t-sub', format(sContract) + ' 원');

setTxt('s3-hp-lump', '- ' + format(lHpVal) + ' 원'); setTxt('s3-hp-sub', '- ' + format(sHpVal * 35) + ' 원'); 

setTxt('s3-card', '- ' + format(sCardVal * 36) + ' 원');
setTxt('s3-cash-lump', '- ' + format(lDcTotal + lPtUse + lAutoCash + lExtraCashTotal) + ' 원');
setTxt('s3-cash-sub', '- ' + format(sAutoCash + sExtraCash) + ' 원');

setTxt('s3-net-lump', format(lNet) + ' 원'); let s3_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) s3_sub_txt = `0 원 (+${format(Math.abs(sNetTotal_raw))} 원 혜택)`;
setTxt('s3-net-sub', s3_sub_txt);
const memoCust = document.getElementById('i-memo-customer') ? document.getElementById('i-memo-customer').value : '';
['s1', 's2'].forEach(p => {
    const cont = document.getElementById(`${p}-memo-container`);
    const txt = document.getElementById(`${p}-memo-text`);
    if (cont && txt) {
        if (memoCust.trim() !== '') {
            txt.innerText = memoCust;
            cont.classList.remove('hidden');
        } else {
            cont.classList.add('hidden');
        }
    }
});



setTxt('s4-lump', format(lNet) + ' 원'); setTxt('s4-sub', s3_sub_txt); 
const s4_total_raw = lNet + sNetTotal_raw;
let s4_total_txt = format(Math.max(0, s4_total_raw)) + ' 원';
if (s4_total_raw < 0) s4_total_txt = `0 원 (+${format(Math.abs(s4_total_raw))} 원 혜택)`;
setTxt('s4-total', s4_total_txt);

setTxt('s5-cnt', lHpCnt + '구좌 가입'); setTxt('s5-month', format(lHpMonth) + ' 원 (1~150회)'); setTxt('s5-refund', format(lHpMonth * 150) + ' 원 (100% 환급)');
setTxt('s6-cnt', sHpCnt + '구좌 가입'); setTxt('s6-month', format(sHpMonth) + ' 원 (1~150회)'); setTxt('s6-refund', format(sHpMonth * 150) + ' 원 (100% 환급)');

['s1','s2','s3','s4'].forEach(prefix => {
    const warn = document.getElementById(`${prefix}-hp-warning`);
    const row = document.getElementById(`${prefix}-hp-row`);
    const hasHp = (prefix === 's1' && lHpCnt > 0) || (prefix === 's2' && sHpCnt > 0) || ((prefix === 's3' || prefix === 's4') && (lHpCnt > 0 || sHpCnt > 0));
    if(warn) {
        if (hasHp) warn.classList.remove('hidden'); else warn.classList.add('hidden');
    }
    if(row) {
        if (hasHp) row.classList.remove('hidden'); else row.classList.add('hidden');
    }
});

}

async function checkAvailableModels() {
const apiKey = getApiKey(); if (!apiKey) return showModal('API 키 오류', '설정에서 API 키를 입력해주세요.', true, false);
showModal('조회 중...', '사용 가능한 AI 모델 목록을 불러오는 중입니다.', false);
try {
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`); const data = await res.json(); closeModal(); if (res.ok && data.models) showModal('AI 모델',`<div class="text-left text-[11px] h-48 overflow-y-auto bg-gray-50 p-2 rounded"><ul>${data.models.map(m=>`<li>✅ ${m.name.replace('models/','')}</li>`).join('')}</ul></div>`, true, false);
else throw new Error(data.error?.message || "목록 로드 불가");
} catch (err) { closeModal(); showModal('조회 실패', err.message, true, false); }
}

async function callGeminiAPI(promptText, fileInfos, apiKey) {
// 유료 결제(할당량 증가)에 맞춰 가장 지능이 뛰어난 Pro 모델 최우선 적용
const models = ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-pro-latest', 'gemini-3.8-flash', 'gemini-flash-latest'];
let lastErr = "";
for (const model of models) {
let parts = [{ text: promptText }];
if (fileInfos && fileInfos.length > 0) {
    fileInfos.forEach(f => {
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    });
}
let payload = { contents: [{ role: "user", parts: parts }] };
try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
const data = await response.json();
if (response.ok && data.candidates) return data.candidates[0].content.parts[0].text;
else if (data.error && data.error.code === 404) continue; else throw new Error(data.error?.message);
} catch (err) { lastErr = err.message; if(lastErr.includes("404")) continue; throw err; }
}
throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);}

const fileToBase64 = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = error => reject(error); });

function scanComputer() {
const fileInput = document.getElementById('camera-input');
fileInput.onchange = async (e) => {
if(!e.target.files.length) return; 
const files = Array.from(e.target.files);
showModal('AI 다중 품목 분석 중... 🔍', '전산 화면 속 여러 가전제품을 모두 찾아내어 분석하고 있습니다. 잠시만 기다려주세요.', false);
try {
const apiKey = getApiKey(); if (!apiKey) throw new Error("API 키를 등록해주세요.");
const prompt = `이 이미지는 가전 매장 전산(POS/ERP) 화면입니다. 화면에 있는 가전제품 목록과 혜택 내역을 추출하여 완벽한 JSON 객체 형태로만 응답하세요.
[추출 규칙]
1. "items" 배열: 실제 가전 제품의 '품목명(또는 상품명)', '모델명(상품코드)', '수량', '금액(숫자만)'을 추출합니다. (캐시백/할인/포인트 내역은 이 배열에서 제외하세요)
2. "benefits" 객체: 화면에서 즉시할인, 총 포인트, 사용 포인트, 추가(익월) 캐시백 금액이 보인다면 숫자로 추출합니다. (없으면 0) 금액대별 자동 캐시백은 냅두고 명시적인 추가 캐시백만 찾습니다.
3. 반드시 JSON 객체 형태 { "items": [...], "benefits": {...} } 로만 반환하고 마크다운 백틱은 생략하세요.
[JSON 응답 예시]
{  "items": [    {"name": "삼성전자 Mini LED TV", "model": "KU85MH80AFXKR", "qty": 1, "price": 2890000},    {"name": "삼성 3구 인덕션", "model": "CC99F63U1DS", "qty": 1, "price": 1735000}  ],  "benefits": {    "instant_dc": 50000,    "point_tot": 10000,    "point_use": 10000,    "extra_cashback": 0  }}`;

const fileInfos = await Promise.all(files.map(async f => ({
    mimeType: f.type,
    base64: await fileToBase64(f)
})));
const responseText = await callGeminiAPI(prompt, fileInfos, apiKey);
const data = JSON.parse(responseText.replace(/```json|```/g, '').trim());
document.getElementById('lump-inputs').innerHTML = '';
let html = '';
data.items.forEach(item => { html += `
<div class="flex gap-1 mb-1 items-center l-row">
<input type="text" class="input-box w-[25%] text-[10px] font-bold l-name" value="${item.name}">
<input type="text" class="input-box w-[35%] text-[10px] l-model" value="${item.model}">
<input type="number" class="input-box w-[15%] text-xs text-center l-qty" value="${item.qty}">
<input type="number" class="input-box w-[25%] text-xs text-right l-price" value="${item.price}">
<button type="button" onclick="this.parentElement.remove(); calc();" class="bg-gray-200 text-gray-500 px-2 py-1 rounded text-xs hover:bg-gray-300">X</button>
</div>`; });
document.getElementById('lump-inputs').innerHTML = html;
if (data.benefits) {
    if (data.benefits.instant_dc) document.getElementById('l-dc').value = data.benefits.instant_dc;
    if (data.benefits.point_tot) document.getElementById('l-pt-tot').value = data.benefits.point_tot;
    if (data.benefits.point_use) document.getElementById('l-pt-use').value = data.benefits.point_use;
    if (data.benefits.extra_cashback) document.getElementById('l-cash').value = data.benefits.extra_cashback;
}
calc(); document.getElementById('close-modal-btn').click();
} catch (error) { showModal('오류 발생', error.message, true); }
fileInput.value = ''; }; fileInput.click(); }



function resetQuotation() {
document.querySelector('input[name="i-type"][value="일반"]').checked = true;
['i-name', 'i-c-phone', 'i-manager', 'i-no', 'l-dc', 'l-pt-tot', 'l-pt-use', 'l-cash', 's-cash'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
document.getElementById('i-phone').value = '031-767-1044';
document.getElementById('lump-inputs').innerHTML = ''; addLumpRow(); document.getElementById('l-card').selectedIndex = 0; document.getElementById('lump-hp-container').innerHTML = '';
document.getElementById('sub-inputs').innerHTML = ''; addSubRow(); document.getElementById('s-card-corp').value = 'none'; updateCardTiers(); document.getElementById('sub-hp-container').innerHTML = '';
calc();
currentEditingFolderId = null;
currentEditingQuoteId = null;
showModal('초기화 완료 🔄', '내용이 모두 초기화되었습니다.', true, false);
}

function updateCardTiers() {
const corp = document.getElementById('s-card-corp').value; const tierSelect = document.getElementById('s-card-tier'); tierSelect.innerHTML = '';
if (SUB_CARDS[corp] && SUB_CARDS[corp].tiers) SUB_CARDS[corp].tiers.forEach(t => { const opt = document.createElement('option'); opt.value = t.v; opt.text = t.t; tierSelect.appendChild(opt); });
}

// [수정됨] 전체 캡처 강제 늘림 코드를 삭제하고, 왜곡 없이 보이는 화면 그대로 캡처하도록 간소화
async function runCapture(targetEl, filename) {
return new Promise((resolve) => {
showModal('이미지 변환 중... 📸', '기기에 이미지를 바로 저장합니다.<br>잠시만 기다려주세요.', false);
const origScrollX = window.scrollX; const origScrollY = window.scrollY; window.scrollTo(0, 0);

setTimeout(async () => {
try {
const canvas = await html2canvas(targetEl, {
scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: false,
scrollY: 0, windowY: 0, logging: false,
ignoreElements: (node) => ['custom-modal', 'ai-msg-modal', 'admin-settings-modal', 'save-quote-modal', 'manage-quote-modal'].includes(node.id)
});

window.scrollTo(origScrollX, origScrollY);

// 즉시 파일 다운로드 처리
const imageURL = canvas.toDataURL('image/png');
const a = document.createElement('a');
a.href = imageURL;
a.download = filename;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

closeModal();
showModal('저장 완료 ✅', `이미지 파일(${filename})이 기기에 다운로드되었습니다.`, true, false);
resolve();
} catch(e) {
window.scrollTo(origScrollX, origScrollY); closeModal(); showModal('저장 실패', '이미지 변환 중 오류가 발생했습니다.', true, false); resolve();
}
}, 500);
});
}

function maskModels(mask) {
document.querySelectorAll('.model-cell').forEach(cell => {
if (mask) { cell.setAttribute('data-original', cell.innerText); if (cell.innerText.length > 3 && cell.innerText !== '-') cell.innerText = cell.innerText.substring(0, 3) + '**'; else if (cell.innerText.length > 0 && cell.innerText !== '-') cell.innerText += '*'; }
else { if (cell.getAttribute('data-original') !== null) cell.innerText = cell.getAttribute('data-original'); }
});
}

async function saveCurrentSheet(mode = 'normal') {
const activeSheet = document.querySelector('.sheet-view.active');
const cName = document.getElementById('i-name').value || '고객';
if (mode === 'masked') maskModels(true);
await runCapture(activeSheet, `하이마트_견적서_${cName}_${Date.now()}.png`);
if (mode === 'masked') maskModels(false);
}

function openAIMsgModal() {
const m = document.getElementById('ai-msg-modal'); if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
if (!cachedAIMessages[currentAIMode]) generateAIMessage(); else document.getElementById('ai-msg-content').innerText = cachedAIMessages[currentAIMode];
}

function switchAIMsgTab(mode) {
currentAIMode = mode;
if (mode === 'nonbuy') { document.getElementById('tab-btn-nonbuy').className = "flex-1 py-2 text-center text-rose-600 border-b-2 border-rose-600"; document.getElementById('tab-btn-bought').className = "flex-1 py-2 text-center text-gray-400 hover:text-gray-600"; }
else { document.getElementById('tab-btn-bought').className = "flex-1 py-2 text-center text-rose-600 border-b-2 border-rose-600"; document.getElementById('tab-btn-nonbuy').className = "flex-1 py-2 text-center text-gray-400 hover:text-gray-600"; }
if (!cachedAIMessages[mode]) generateAIMessage(); else document.getElementById('ai-msg-content').innerText = cachedAIMessages[mode];
}

async function generateAIMessage() {
showModal('AI 톡 작성 중... ✍️', '고객 맞춤형 스마트 상담 메시지를 생성 중입니다.', false);
try {
  const cName = document.getElementById('i-name').value || '고객';
  const cType = document.querySelector('input[name="i-type"]:checked')?.value || '일반';
  const finalNet = document.getElementById('s1-final')?.innerText || '0 원';
  const card = document.getElementById('l-card')?.value || '미정';
  
  // 수집된 품목 정보
  let itemsStr = "";
  document.querySelectorAll('.l-name').forEach((el, i) => {
    if(el.value) itemsStr += `- ${el.value} (${document.querySelectorAll('.l-price')[i].value}원)\n`;
  });
  
  const dc = document.getElementById('l-dc')?.value || 0;
  const hpStr = document.getElementById('lump-hp-preview')?.innerText || '0원';
  
  let prompt = `당신은 롯데하이마트 최고 영업 사원(AI 비서)입니다.
아래의 고객 상담 내역을 바탕으로 고객에게 카카오톡으로 보낼 매우 친절하고 설득력 있는 영업 메시지를 작성해주세요.

[고객 정보]
- 고객 성명: ${cName}님 (${cType} 입주/웨딩 등 타겟)
- 총 체감가(최종 혜택가): ${finalNet}
- 상담 품목: \n${itemsStr}
- 즉시할인: ${dc}원
- 하이프리드 결합 환급액: ${hpStr}
- 결제 예정 카드: ${card}

[작성 조건]
1. 인삿말과 맺음말을 포함해 주세요. (롯데하이마트 경기광주점 담당자 올림)
2. 고객이 받게 되는 가장 큰 혜택(최종 체감가, 할인액 등)을 강조해서 지금이 구매 최적기임을 어필해주세요.
3. 이모지(✨, 🎁, 💡 등)를 적절히 사용해 가독성을 높이되, **나 ### 같은 마크다운 특수문자는 절대 사용하지 말고 일반 텍스트로만 깔끔하게 작성해주세요.
4. `;

  prompt += (currentAIMode === 'nonbuy') 
    ? `방문해주셔서 감사하다는 내용과 함께, 위 견적대로 구매를 결정하시면 최고의 조건이라는 점을 다시 한번 부드럽게 상기시키는 '미구매(가망) 고객 팔로업' 메시지를 작성하세요.` 
    : `위 내용으로 결제가 완료/확정되었다고 가정하고, 선택해주셔서 감사하다는 인사와 혜택(캐시백 일정 등)을 간략히 요약하여 안내하는 '구매 확정 고객 안내' 메시지를 작성하세요.`;

  const apiKey = getApiKey(); if (!apiKey) throw new Error("API 키 오류");
  const responseText = await callGeminiAPI(prompt, null, null, apiKey);
  cachedAIMessages[currentAIMode] = responseText; closeModal(); document.getElementById('ai-msg-content').innerText = responseText;
} catch(error) { closeModal(); showModal('생성 실패 ❌', error.message, true, false); }
}

function copyAIMessage() {
const text = document.getElementById('ai-msg-content')?.innerText; if (!text) return;
if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => showModal('완료', '복사되었습니다!', true, false)).catch(() => fallbackCopy(text)); else fallbackCopy(text);
}

function fallbackCopy(text) {
const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; document.body.appendChild(textArea);
textArea.focus(); textArea.select(); try { document.execCommand('copy'); showModal('완료', '복사되었습니다!', true, false); } catch (err) { showModal('오류', '복사 실패', true, false); } document.body.removeChild(textArea);
}

async function summarizeModel(modelCode, itemName) {
if (!modelCode || modelCode.trim() === '') return showModal('알림', '모델명을 먼저 입력해주세요.', true, false);
showModal('AI 제품 분석 중... 💡', `'${modelCode}' 모델의 핵심 특장점을 분석 중입니다.`, false);
try {
  const prompt = `당신은 롯데하이마트 가전제품 전문 상담사(AI)입니다.
제품명: ${itemName}
모델명: ${modelCode}

위 모델명에 대해 고객에게 어필할 수 있는 가장 강력하고 핵심적인 특장점 3가지를 찾아서, 전문적이고 설득력 있는 영업 소구 포인트로 짧게 요약해 주세요. 
(가독성 좋게 이모지 사용, 짧고 임팩트 있게 작성하되, **, ### 같은 마크다운 특수기호는 절대 쓰지 말고 일반 텍스트로만 깔끔하게 작성할 것)`;
  const apiKey = getApiKey(); if (!apiKey) throw new Error("API 키 오류");
  const responseText = await callGeminiAPI(prompt, null, null, apiKey);
  closeModal();
  showModal(`💡 ${modelCode} 특장점`, `<div class="text-left text-sm whitespace-pre-wrap">${responseText}</div>`, true, false);
} catch(err) {
  closeModal(); showModal('분석 실패 ❌', err.message, true, false);
}
}

async function analyzeFolderQuotes(folderId) {
const folders = getFolders();
const f = folders.find(x => x.id === folderId);
if(!f || f.quotes.length < 2) return;

const apiKey = getApiKey();
if (!apiKey) return showModal('API 키 오류', '설정에서 API 키를 등록해주세요.', true, false);

document.getElementById('manage-quote-modal').classList.add('hidden');
showModal('AI 견적 비교 중... ✨', `${f.name} 고객님의 여러 견적서를 분석하고 최적의 제안을 찾고 있습니다.`, false);

let quotesData = f.quotes.map((q, idx) => {
  return `[견적 ${idx + 1}: ${q.title}]\n최종 체감가: ${q.data.netPrice || q.data.finalPrice}원\n할인액: ${q.data.lumpDc}원\n하이프리드: ${q.data.lumpHp ? q.data.lumpHp.map(h => h.val).join(',') : '없음'}`;
}).join('\n\n');

try {
  const prompt = `당신은 롯데하이마트 1급 영업 사원입니다. 한 고객을 위해 저장된 여러 버전의 견적서 데이터를 줄 테니, 영업 사원이 고객에게 브리핑하기 좋도록 각 견적의 차이점과 '가장 추천하는 안'을 요약해주세요.

${quotesData}

[작성 조건]
1. 각 견적의 가격 차이를 명확히 짚어줄 것.
2. 혜택(최종 체감가)이 가장 좋은 견적을 강력히 추천할 것.
3. 짧고 명확하게, 카톡으로 바로 보내거나 구두로 브리핑할 수 있는 톤앤매너로 작성할 것 (이모지 포함).
4. **, ### 같은 마크다운 특수기호는 절대 쓰지 말고 일반 텍스트로만 깔끔하게 작성할 것.`;

  const responseText = await callGeminiAPI(prompt, null, null, apiKey);
  closeModal();
  showModal(`✨ ${f.name} 고객 견적 비교`, `<div class="text-left text-xs whitespace-pre-wrap leading-relaxed">${responseText}</div>`, true, false);
} catch(err) {
  closeModal(); showModal('분석 실패 ❌', err.message, true, false);
}
}

