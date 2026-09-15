import sys

content = open('index.html').read()

old_logic = "setTxt('s3-hp-lump', '- ' + format(lHpVal) + ' 원'); setTxt('s3-hp-sub', '- ' + format(sHpVal * 35) + ' 원'); setTxt('s3-card', '- ' + format(sCardVal * 36) + ' 원');\nsetTxt('s3-cash-lump', '- ' + format(lDc + lPtUse + lAutoCash + lExtraCash) + ' 원'); setTxt('s3-cash-sub', '- ' + format(sAutoCash + sExtraCash) + ' 원');\nsetTxt('s3-net-lump', format(lNet) + ' 원'); let s3_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) s3_sub_txt = `0 원 (+${format(Math.abs(sNetTotal_raw))} 원 혜택)`;\nsetTxt('s3-net-sub', s3_sub_txt);"

new_logic = """
setTxt('s3-hp-lump', '- ' + format(lHpVal) + ' 원'); setTxt('s3-hp-sub', '- ' + format(sHpVal * 35) + ' 원'); 

let s3BenefitsHTML = '';
s3BenefitsHTML += `<tr><td class="text-gray-800 bg-gray-50/50">(-) 제휴카드 할인 혜택</td><td class="text-right text-gray-400 bg-gray-50/50">-</td><td class="text-right text-blue-600 bg-gray-50/50">- ${format(sCardVal * 36)} 원</td></tr>`;
if (lDc > 0) s3BenefitsHTML += `<tr><td class="text-gray-800">(-) 기본 즉시 할인액</td><td class="text-right text-rose-600">- ${format(lDc)} 원</td><td class="text-right text-gray-400">-</td></tr>`;
if (lPtUse > 0) s3BenefitsHTML += `<tr><td class="text-gray-800">(-) 포인트 즉시 사용</td><td class="text-right text-rose-600">- ${format(lPtUse)} 원</td><td class="text-right text-gray-400">-</td></tr>`;
if (lAutoCash > 0 || sAutoCash > 0) s3BenefitsHTML += `<tr><td class="text-gray-800">(-) 금액별 자동 캐시백</td><td class="text-right text-rose-600">${lAutoCash>0 ? '- '+format(lAutoCash)+' 원' : '-'}</td><td class="text-right text-blue-600">${sAutoCash>0 ? '- '+format(sAutoCash)+' 원' : '-'}</td></tr>`;
let lExtCsh = getVal('l-cash');
let sExtCsh = getVal('s-cash');
if (lExtCsh > 0 || sExtCsh > 0) s3BenefitsHTML += `<tr><td class="text-gray-800">(-) 기본 추가 캐시백</td><td class="text-right text-rose-600">${lExtCsh>0 ? '- '+format(lExtCsh)+' 원' : '-'}</td><td class="text-right text-blue-600">${sExtCsh>0 ? '- '+format(sExtCsh)+' 원' : '-'}</td></tr>`;

benefitRows.forEach(b => {
    if(b.type === 'dc') {
        s3BenefitsHTML += `<tr><td class="text-gray-800">(-) [추가할인] ${b.desc}</td><td class="text-right text-rose-600">- ${format(b.val)} 원</td><td class="text-right text-gray-400">-</td></tr>`;
    } else if(b.type === 'cash') {
        s3BenefitsHTML += `<tr><td class="text-gray-800">(-) [캐시백] ${b.desc}</td><td class="text-right text-rose-600">- ${format(b.val)} 원</td><td class="text-right text-gray-400">-</td></tr>`;
    } else if(b.type === 'gift') {
        s3BenefitsHTML += `<tr><td class="text-gray-800">(-) [상품권] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td><td class="text-right text-gray-400">-</td></tr>`;
    }
});

let s3tbody = document.getElementById('s3-benefits-tbody');
if (s3tbody) s3tbody.innerHTML = s3BenefitsHTML;

setTxt('s3-net-lump', format(lNet) + ' 원'); let s3_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) s3_sub_txt = `0 원 (+${format(Math.abs(sNetTotal_raw))} 원 혜택)`;
setTxt('s3-net-sub', s3_sub_txt);

const memoText = document.getElementById('i-memo') ? document.getElementById('i-memo').value : '';
['s1', 's2', 's3', 's4'].forEach(p => {
    const cont = document.getElementById(`${p}-memo-container`);
    const txt = document.getElementById(`${p}-memo-text`);
    if (cont && txt) {
        if (memoText.trim() !== '') {
            txt.innerText = memoText;
            cont.classList.remove('hidden');
        } else {
            cont.classList.add('hidden');
        }
    }
});
"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    # Try with single line
    old_logic_single = "setTxt('s3-hp-lump', '- ' + format(lHpVal) + ' 원'); setTxt('s3-hp-sub', '- ' + format(sHpVal * 35) + ' 원'); setTxt('s3-card', '- ' + format(sCardVal * 36) + ' 원');setTxt('s3-cash-lump', '- ' + format(lDc + lPtUse + lAutoCash + lExtraCash) + ' 원'); setTxt('s3-cash-sub', '- ' + format(sAutoCash + sExtraCash) + ' 원');setTxt('s3-net-lump', format(lNet) + ' 원'); let s3_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) s3_sub_txt = `0 원 (+${format(Math.abs(sNetTotal_raw))} 원 혜택)`;setTxt('s3-net-sub', s3_sub_txt);"
    content = content.replace(old_logic_single, new_logic)

open('index.html', 'w').write(content)
