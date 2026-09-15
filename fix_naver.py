import re
content = open('index.html').read()
old_add_benefit = '''<option value="discount">추가즉시할인</option>
</select>
<input type="text" class="input-box w-[35%] text-[10px] b-desc" placeholder="내용 (선택)" oninput="calc()">'''
new_add_benefit = '''<option value="naver">네이버포인트 적립</option>
<option value="discount">추가즉시할인</option>
</select>
<input type="text" class="input-box w-[35%] text-[10px] b-desc" placeholder="내용 (선택)" oninput="calc()">'''
content = content.replace(old_add_benefit, new_add_benefit)

old_logic = '''const desc = row.querySelector('.b-desc').value || (type==='cashback'?'추가 캐시백':type==='gift'?'상품권':'추가 즉시할인');'''
new_logic = '''const desc = row.querySelector('.b-desc').value || (type==='cashback'?'추가 캐시백':type==='gift'?'상품권':type==='naver'?'네이버포인트':'추가 즉시할인');'''
content = content.replace(old_logic, new_logic)

old_push = '''} else if(type === 'gift') {
                extraCash += val;
                benefitRows.push({type: 'gift', desc, val});
            }'''
new_push = '''} else if(type === 'gift') {
                extraCash += val;
                benefitRows.push({type: 'gift', desc, val});
            } else if(type === 'naver') {
                extraCash += val;
                benefitRows.push({type: 'naver', desc, val});
            }'''
content = content.replace(old_push, new_push)

old_table = '''benefitRows.filter(b=>b.type==='gift').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [상품권] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td></tr>`;
    });'''
new_table = '''benefitRows.filter(b=>b.type==='gift').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [상품권] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td></tr>`;
    });
    benefitRows.filter(b=>b.type==='naver').forEach(b => {
        s1CashRows += `<tr><td class="bg-gray-50 text-gray-800">(-) [네이버포인트] ${b.desc}</td><td class="text-right text-green-600">- ${format(b.val)} 원</td></tr>`;
    });'''
content = content.replace(old_table, new_table)
open('index.html', 'w').write(content)
