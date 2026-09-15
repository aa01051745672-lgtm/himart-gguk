import sys

content = open('index.html').read()

old_block = """setTxt('s3-hp-lump', '- ' + format(lHpVal) + ' 원'); setTxt('s3-hp-sub', '- ' + format(sHpVal * 35) + ' 원'); setTxt('s3-card', '- ' + format(sCardVal * 36) + ' 원');
setTxt('s3-cash-lump', '- ' + format(lDc + lPtUse + lAutoCash + lExtraCash) + ' 원'); setTxt('s3-cash-sub', '- ' + format(sAutoCash + sExtraCash) + ' 원');
setTxt('s3-net-lump', format(lNet) + ' 원'); let s3_sub_txt = format(sNetTotal) + ' 원'; if (sNetTotal_raw < 0) s3_sub_txt = `0 원 (+${format(Math.abs(sNetTotal_raw))} 원 혜택)`;
setTxt('s3-net-sub', s3_sub_txt);"""

# Wait, `lExtraCash` was renamed in my previous update? Let's check `calc()` again.
