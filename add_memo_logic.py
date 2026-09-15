import re
content = open('index.html').read()
pattern = r"setTxt\('s3-net-sub', s3_sub_txt\);"
new_code = """setTxt('s3-net-sub', s3_sub_txt);
const memoCust = document.getElementById('i-memo-customer') ? document.getElementById('i-memo-customer').value : '';
['s1', 's2'].forEach(p => {
    const cont = document.getElementById(`${p}-memo-container`);
    const txt = document.getElementById(`${p}-memo-text`);
    if (cont && txt) {
        if (memoCust.trim() !== '') {
            txt.innerText = memoCust;
            cont.classList.remove('hidden');
        } else {
            cont.classList.add('hidden');
        }
    }
});
"""
content = re.sub(pattern, new_code, content, count=1)
open('index.html', 'w').write(content)
