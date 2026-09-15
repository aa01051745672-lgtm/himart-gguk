import sys
import re

content = open('index.html').read()

memo_html = '''<div id="{sheet}-memo-container" class="mt-4 hidden border-t-2 border-gray-800 pt-4">
  <h3 class="text-sm font-bold text-gray-800 mb-1">■ 상담 메모</h3>
  <div id="{sheet}-memo-text" class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed"></div>
</div>
<div class="text-right text-xs font-bold text-gray-500">롯데하이마트 경기광주점</div>'''

for sheet in ['s1', 's2', 's3', 's4']:
    old = '<div class="text-right text-xs font-bold text-gray-500 mb-3">롯데하이마트 경기광주점</div>' if sheet == 's2' else '<div class="text-right text-xs font-bold text-gray-500">롯데하이마트 경기광주점</div>'
    if sheet == 's1':
        old_s1 = '<div class="text-right text-xs font-bold text-gray-500">롯데하이마트 경기광주점</div>'
        # wait, sheet1 actually has:
        # <div class="notice-box">📌 ...
        # <div id="s1-hp-warning" ...
        pass # we'll replace the text-right one
    content = content.replace('<div class="text-right text-xs font-bold text-gray-500">롯데하이마트 경기광주점</div>', memo_html.format(sheet=sheet))

open('index.html', 'w').write(content)
