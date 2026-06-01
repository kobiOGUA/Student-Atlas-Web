with open('dashboard.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'id="gpa-screen"' in l or "id='gpa-screen'" in l:
        print(''.join(lines[i:i+40]))
        break
