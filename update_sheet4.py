import sys

content = open('index.html').read()

s4_benefits = """<div class="mt-2 border-t-2 border-gray-400 pt-3">
  <h3 class="text-xs font-bold text-gray-800 mb-2">■ 동시 진행 시 적용된 혜택 요약</h3>
  <table class="w-full print-table mb-2">
    <tbody id="s4-benefits-tbody"></tbody>
  </table>
</div>
<div id="s4-memo-container\""""

content = content.replace('<div id="s4-memo-container"', s4_benefits)

calc_s4_update = """
let s4BenefitsHTML = '';
if(lHpVal > 0 || sHpVal > 0) s4BenefitsHTML += `<tr><td class="text-gray-800 bg-gray-50">(-) 하이프리드 지원 혜택 합산</td><td class="text-right text-rose-600">- ${format(lHpVal + sHpVal * 35)} 원</td></tr>`;
if(sCardVal > 0) s4BenefitsHTML += `<tr><td class="text-gray-800 bg-gray-50">(-) 제휴카드 할인 혜택 합산</td><td class="text-right text-blue-600">- ${format(sCardVal * 36)} 원</td></tr>`;
let dcSum = lDc + extraDc + lPtUse;
if(dcSum > 0) s4BenefitsHTML += `<tr><td class="text-gray-800 bg-gray-50">(-) 총 즉시 할인액</td><td class="text-right text-rose-600">- ${format(dcSum)} 원</td></tr>`;
let cashSum = lAutoCash + sAutoCash + getVal('l-cash') + getVal('s-cash') + extraCash;
if(cashSum > 0) s4BenefitsHTML += `<tr><td class="text-gray-800 bg-gray-50">(-) 총 캐시백 및 상품권 혜택</td><td class="text-right text-green-600">- ${format(cashSum)} 원</td></tr>`;

let s4tbody = document.getElementById('s4-benefits-tbody');
if (s4tbody) s4tbody.innerHTML = s4BenefitsHTML;

const memoText = document.getElementById('i-memo') ? document.getElementById('i-memo').value : '';
"""

content = content.replace("const memoText = document.getElementById('i-memo') ? document.getElementById('i-memo').value : '';", calc_s4_update)
open('index.html', 'w').write(content)
