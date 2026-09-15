import re
content = open('index.html').read()

pattern = r'const firstRowName = document\.querySelector\(\'\.l-name\'\);.*?e\.target\.value = \'\';\n\}; fileInput\.click\(\);\n\}'
# wait, the last line is probably `}; fileInput.click();\n}`
content = re.sub(pattern, '', content, flags=re.DOTALL)
open('index.html', 'w').write(content)
