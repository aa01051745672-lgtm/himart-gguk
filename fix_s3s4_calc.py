import re
content = open('index.html').read()
pattern = r"let s3BenefitsHTML = '';.*?if \(s3tbody\) s3tbody\.innerHTML = s3BenefitsHTML;"
new_code = "setTxt('s3-card', '- ' + format(sCardVal * 36) + ' 원');\nsetTxt('s3-cash-lump', '- ' + format(lDcTotal + lPtUse + lAutoCash + lExtraCashTotal) + ' 원');\nsetTxt('s3-cash-sub', '- ' + format(sAutoCash + sExtraCash) + ' 원');"
content = re.sub(pattern, new_code, content, flags=re.DOTALL)
open('index.html', 'w').write(content)
