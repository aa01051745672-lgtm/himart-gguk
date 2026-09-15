import re
content = open('index.html').read()
content = re.sub(r'throw new Error\(`지원되는 AI 모델 없음: \$\{lastErr\}`\);\}throw new Error\(`지원되는 AI 모델 없음: \$\{lastErr\}`\);\}', r'throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);}', content)
open('index.html', 'w').write(content)
