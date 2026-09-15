import sys
import re

content = open('index.html').read()

# Replace sheet1 pay table innerHTML in calc()
# We'll just find where lPay is calculated and add our new logic.
calc_pattern = r"const lPay = Math\.max\(0, lSum - lDc - lPtUse - lHpVal\);.*?const lExtraCash = getVal\('l-cash'\);.*?setTxt\('s1-final', format\(lNet\) \+ ' 원'\);"

new_calc_logic = '''
    let extraDc = 0;
    let extraCash = 0;
    let benefitRows = [];

    document.querySelectorAll('.benefit-lump-row').forEach(row => {
        const type = row.querySelector('.b-type').value;
        const desc = row.querySelector('.b-desc').value || (type==='cashback'?'추가 캐시백':type==='gift'?'상품권':'추가 즉시할인');
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
    s1CashRows += `<tr class="border-t-2 border-gray-400"><td class="bg-gray-100 font-extrabold text-gray-900">★ 고객 체감 순비용</td><td class="text-right font-extrabold text-xl text-rose-700">${format(lNet)} 원</td></tr>`;
    
    document.getElementById('s1-cash-tbody').innerHTML = s1CashRows;

    setTxt('s1-pt-tot-view', format(lPtTot)); setTxt('s1-pt-remain', format(Math.max(0, lPtTot - lPtUse)));
'''

content = re.sub(calc_pattern, new_calc_logic, content, flags=re.DOTALL)

open('index.html', 'w').write(content)
