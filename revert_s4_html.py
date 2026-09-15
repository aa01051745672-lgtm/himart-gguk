import re
content = open('index.html').read()
old_s4 = '''<div class="mt-2 border-t-2 border-gray-400 pt-3">
  <h3 class="text-xs font-bold text-gray-800 mb-2">■ 동시 진행 시 적용된 혜택 요약</h3>
  <table class="w-full print-table mb-2">
    <tbody id="s4-benefits-tbody"></tbody>
  </table>
</div>'''
content = content.replace(old_s4, '')
open('index.html', 'w').write(content)
