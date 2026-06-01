import re

with open('found_simulator.js', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'window\.loadGPASimulator = async function.*?\} catch \(error\) \{', content, re.DOTALL)
if matches:
    # Get the shortest one
    m = min(matches, key=len)
    
    # Simple fix for JSON escapes, though maybe it's not JSON escaped
    # Let's just output it to see
    with open('simulator_function.js', 'w', encoding='utf-8') as f:
        f.write(m)
    print(f'Wrote {len(m)} chars')
