import re
content = open('index.html').read()
old_memo = '''<div class="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
  <label class="block text-sm font-bold text-gray-800 mb-2">상담 내용 메모 (통합, 패키지, 3종비교에 출력)</label>
  <textarea id="i-memo" class="input-box w-full h-20" placeholder="고객님께 전달할 특별 사항이나 상담 메모를 적어주세요." oninput="calc()"></textarea>
</div>'''

new_memo = '''<div class="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
  <label class="block text-sm font-bold text-gray-800 mb-1">고객 전달용 견적서 메모 <span class="font-normal text-xs">(일반/구독 하단 출력)</span></label>
  <textarea id="i-memo-customer" class="input-box w-full h-16 mb-3" placeholder="견적서 하단에 들어갈 유의사항이나 안내를 적어주세요." oninput="calc()"></textarea>
  <label class="block text-sm font-bold text-gray-800 mb-1">나만의 상담 메모 <span class="font-normal text-xs">(출력 X, 내부 확인용)</span></label>
  <textarea id="i-memo" class="input-box w-full h-16" placeholder="상담 중 기록할 내용을 메모하세요." oninput="calc()"></textarea>
</div>'''
content = content.replace(old_memo, new_memo)

old_calc_memo = '''const memoText = document.getElementById('i-memo') ? document.getElementById('i-memo').value : '';
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
});'''

new_calc_memo = '''const memoCust = document.getElementById('i-memo-customer') ? document.getElementById('i-memo-customer').value : '';
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
['s3', 's4'].forEach(p => {
    const cont = document.getElementById(`${p}-memo-container`);
    if (cont) cont.classList.add('hidden');
});'''

content = content.replace(old_calc_memo, new_calc_memo)
open('index.html', 'w').write(content)
