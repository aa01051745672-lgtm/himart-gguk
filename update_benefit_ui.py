import sys
import re

content = open('index.html').read()

benefit_ui = '''<div class="pt-3 mt-2 border-t border-rose-200">
<div class="flex justify-between items-center mb-2">
<span class="text-xs font-bold text-rose-800">기타 혜택 (상품권, 추가할인 등)</span>
<button type="button" onclick="addLumpBenefitRow()" class="text-xs bg-rose-100 border border-rose-300 text-rose-700 px-2 py-0.5 rounded shadow-sm">+ 혜택추가</button>
</div>
<div id="lump-benefit-container" class="space-y-1 mb-2"></div>
</div>
<div class="pt-3 mt-2 border-t border-rose-200">'''

content = content.replace('<div class="pt-3 mt-2 border-t border-rose-200">', benefit_ui, 1)

# Add addLumpBenefitRow() function inside script
benefit_script = '''function addLumpBenefitRow() {
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
content = content.replace('function addLumpRow()', benefit_script + '\nfunction addLumpRow()')

open('index.html', 'w').write(content)
