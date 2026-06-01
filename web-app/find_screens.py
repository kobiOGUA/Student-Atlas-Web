with open('dashboard.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'id="gpa-screen"' in l or "id='gpa-screen'" in l:
        print('GPA:', i)
    if 'id="planner-screen"' in l or "id='planner-screen'" in l:
        print('Planner:', i)
