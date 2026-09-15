import re
content = open('index.html').read()
old_s3 = '<tbody id="s3-benefits-tbody"></tbody>'
new_s3 = '''<tr><td class="text-gray-800" id="s3-card-label">(-) 제휴카드 혜택</td><td class="text-right text-gray-400">-</td><td class="text-right text-blue-600" id="s3-card">0 원</td></tr>
<tr><td class="text-gray-800">(-) 캐시백/할인 (즉시+자동+추가)</td><td class="text-right text-rose-600" id="s3-cash-lump">0 원</td><td class="text-right text-rose-600" id="s3-cash-sub">0 원</td></tr>'''
content = content.replace(old_s3, new_s3)
open('index.html', 'w').write(content)
