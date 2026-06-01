import re

with open(r'C:\Users\kobio\.gemini\antigravity\brain\81dab207-d8b5-433a-be35-70b445dcca09\.tempmediaStorage\dom_1779814033404.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Just extract the whole thing to a file first so we can see it
with open('extracted_dom.html', 'w', encoding='utf-8') as f:
    f.write(content)
