import re
content = open('index.html').read()
content = content.replace('throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);}\nthrow new Error(`지원되는 AI 모델 없음: ${lastErr}`);}', 'throw new Error(`지원되는 AI 모델 없음: ${lastErr}`);}')
open('index.html', 'w').write(content)
