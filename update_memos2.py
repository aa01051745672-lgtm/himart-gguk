import sys
import re

content = open('index.html').read()

def add_memo(sheet_id, html_content):
    pattern = rf'(<div id="{sheet_id}".*?)(<div class="text-right text-xs font-bold text-gray-500">롯데하이마트 경기광주점</div>)'
    memo_html = f'''<div id="{sheet_id[:2]}-memo-container" class="mt-4 hidden border-t-2 border-gray-800 pt-4 text-left">
  <h3 class="text-xs font-bold text-gray-800 mb-1">■ 상담 메모</h3>
  <div id="{sheet_id[:2]}-memo-text" class="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed"></div>
</div>
\\2'''
    return re.sub(pattern, rf'\1{memo_html}', html_content, count=1, flags=re.DOTALL)

for s in ['sheet1', 'sheet2', 'sheet3', 'sheet4']:
    content = add_memo(s, content)

open('index.html', 'w').write(content)
