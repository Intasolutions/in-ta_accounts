import re

with open('frontend/src/pages/ProjectDetail.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'//.*', '', code)
code = re.sub(r'/\*[\s\S]*?\*/', '', code)
code = re.sub(r"\'[^\']*\'", "''", code)
code = re.sub(r'\"[^\"]*\"', '""', code)
code = re.sub(r'\`[^\`]*\`', '``', code)

lines = code.split('\n')
d = 0
for i, l in enumerate(lines):
    d += l.count('{') - l.count('}')
    if d != 0:
        print(f'{i+1}: {d}')
