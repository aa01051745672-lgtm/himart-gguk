import re
content = open('index.html').read()
benefit_script = '''
function addLumpBenefitRow() {
const div = document.createElement('div');
div.className = "flex gap-1 mb-1 items-center benefit-lump-row";
div.innerHTML = `
<select class="input-box w-[30%] text-[10px] b-type" onchange="calc()">
<option value="cashback">추가 캐시백</option>
<option value="gift">상품권</option>
<option value="discount">추가즉시할인</option>
</select>
<input type="text" class="input-box w-[35%] text-[10px] b-desc" placeholder="내용 (선택)" oninput="calc()">
<input type="number" class="input-box w-[25%] text-xs text-right b-val" placeholder="0" oninput="calc()">
<button type="button" onclick="this.parentElement.remove(); calc();" class="w-[10%] bg-gray-200 text-gray-500 px-2 py-1.5 rounded text-xs hover:bg-gray-300">X</button>
`;
document.getElementById('lump-benefit-container').appendChild(div);
}
'''

content = content.replace('function addLumpRow', benefit_script + 'function addLumpRow')
open('index.html', 'w').write(content)
