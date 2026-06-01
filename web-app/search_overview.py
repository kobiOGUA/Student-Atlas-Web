import re

log_path = r'C:\Users\kobio\.gemini\antigravity\brain\81dab207-d8b5-433a-be35-70b445dcca09\.system_generated\logs\overview.txt'
with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

matches = re.findall(r'<div id=\"gpa-simulator.*?</div>', content, re.DOTALL)
if matches:
    print('Found HTML in overview.txt!')
else:
    print('No HTML found in overview.txt')
