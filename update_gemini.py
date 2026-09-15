import sys
import re

content = open('index.html').read()

# Replace callGeminiAPI
old_call = """async function callGeminiAPI(promptText, imageDataBase64, mimeType, apiKey) {
const isImage = !!imageDataBase64;
// 유료 결제(할당량 증가)에 맞춰 가장 지능이 뛰어난 Pro 모델 최우선 적용
// 가장 강력한 3.1 Pro 및 2.5 Pro를 1순위로 시도하며, 만약을 대비해 3.8 Flash로 Fallback
const models = ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-pro-latest', 'gemini-3.8-flash', 'gemini-flash-latest'];
let lastErr = "";
for (const model of models) {
let payload = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
if (isImage) { payload.contents[0].parts.push({ inlineData: { mimeType, data: imageDataBase64 } }); }
try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
const data = await response.json();
if (response.ok && data.candidates) return data.candidates[0].content.parts[0].text;
else if (data.error && data.error.code === 404) continue; else throw new Error(data.error?.message);
} catch (err) { lastErr = err.message; if(lastErr.includes("404")) continue; throw err; }
}
throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);
}"""

new_call = """async function callGeminiAPI(promptText, fileInfos, apiKey) {
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
throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);
}"""

content = content.replace(old_call.replace("\n", ""), new_call)
# Need to use regex to replace robustly

pattern = r"async function callGeminiAPI\(promptText, imageDataBase64, mimeType, apiKey\) \{.*?\n\}\n"
content = re.sub(pattern, new_call + '\n', content, flags=re.DOTALL)

# Replace scanComputer
pattern_scan = r"function scanComputer\(\) \{.*?const responseText = await callGeminiAPI\(prompt, await fileToBase64\(file\), file\.type, apiKey\);.*?\"\); \}\n"
content = re.sub(pattern_scan, '''function scanComputer() {
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
''', content, flags=re.DOTALL)

open('index.html', 'w').write(content)
