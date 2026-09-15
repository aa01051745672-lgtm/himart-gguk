import sys
import re

content = open('index.html').read()

# Update sheet1 pay table
s1_pay_old = '''<table class="w-full print-table mb-2">
<tr><td class="bg-gray-50 font-bold w-2/3">총 행사가 합계</td><td class="text-right font-bold text-gray-900" id="s1-total">0 원</td></tr>
<tr><td class="bg-gray-50 text-gray-800">(-) 즉시 할인액</td><td class="text-right text-rose-600" id="s1-dc">0 원</td></tr>
<tr><td class="bg-gray-50 text-gray-800">(-) 포인트 즉시 사용</td><td class="text-right text-rose-600" id="s1-pt-use">0 원</td></tr>
<tr id="s1-hp-row"><td class="bg-gray-50 font-bold text-rose-700">(-) 하이프리드 결합 지원금 (제휴카드 35개월 분할상쇄)</td><td class="text-right text-rose-600 font-bold" id="s1-hp">0 원</td></tr>
<tr><td class="bg-gray-200 font-extrabold text-gray-900">최종 결제 금액 (실결제 기준)</td><td class="text-right font-extrabold text-base text-gray-900" id="s1-pay">0 원</td></tr>
</table>'''

s1_pay_new = '''<table class="w-full print-table mb-2">
<tbody id="s1-pay-tbody">
</tbody>
</table>'''
content = content.replace(s1_pay_old, s1_pay_new)

# Update sheet1 cash table
s1_cash_old = '''<table class="w-full print-table mb-3">
<tr><td class="bg-gray-50 text-gray-800">(-) 결제금액별 자동 캐시백 (익월말 계좌입금)</td><td class="text-right text-blue-600" id="s1-auto-cash">0 원</td></tr>
<tr><td class="bg-gray-50 text-gray-800">(-) 추가 캐시백 (배송익월말 계좌입금)</td><td class="text-right text-blue-600" id="s1-extra-cash">0 원</td></tr>
<tr class="border-t-2 border-gray-400"><td class="bg-gray-100 font-extrabold text-gray-900">★ 고객 체감 순비용</td><td class="text-right font-extrabold text-xl text-rose-700" id="s1-final">0 원</td></tr>
</table>'''

s1_cash_new = '''<table class="w-full print-table mb-3">
<tbody id="s1-cash-tbody">
</tbody>
</table>'''
content = content.replace(s1_cash_old, s1_cash_new)

# Update sheet3 cash table (Comparison)
s3_cash_old = '''<tr><td class="text-gray-800" id="s3-card-label">(-) 제휴카드 혜택</td><td class="text-right text-gray-400">-</td><td class="text-right text-blue-600" id="s3-card">0 원</td></tr>
<tr><td class="text-gray-800">(-) 캐시백/할인 (즉시+자동+추가)</td><td class="text-right text-rose-600" id="s3-cash-lump">0 원</td><td class="text-right text-rose-600" id="s3-cash-sub">0 원</td></tr>
<tr class="bg-gray-100 border-t-2 border-gray-400"><td class="font-extrabold text-gray-900">★ 고객 체감 순비용</td><td class="text-right font-extrabold text-2xl text-rose-700" id="s3-net-lump">0 원</td><td class="text-right font-extrabold text-2xl text-blue-700" id="s3-net-sub">0 원</td></tr>'''

s3_cash_new = '''<tbody id="s3-benefits-tbody"></tbody>
<tr class="bg-gray-100 border-t-2 border-gray-400"><td class="font-extrabold text-gray-900">★ 고객 체감 순비용</td><td class="text-right font-extrabold text-2xl text-rose-700" id="s3-net-lump">0 원</td><td class="text-right font-extrabold text-2xl text-blue-700" id="s3-net-sub">0 원</td></tr>'''
content = content.replace(s3_cash_old, s3_cash_new)


# Adding Textarea to the Input Panel
input_memo = '''<div class="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
  <label class="block text-sm font-bold text-gray-800 mb-2">상담 내용 메모 (통합, 패키지, 3종비교에 출력)</label>
  <textarea id="i-memo" class="input-box w-full h-20" placeholder="고객님께 전달할 특별 사항이나 상담 메모를 적어주세요." oninput="calc()"></textarea>
</div>
<!-- 로컬 폴더(고객별) 연동 컨트롤 바 -->'''
content = content.replace('<!-- 로컬 폴더(고객별) 연동 컨트롤 바 -->', input_memo)

open('index.html', 'w').write(content)
