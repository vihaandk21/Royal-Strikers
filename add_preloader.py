import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

preloader = '''
    <!-- Cinematic Preloader -->
    <div id="preloader" style="position: fixed; inset: 0; background: #050505; z-index: 99999; display: flex; align-items: center; justify-content: center;">
        <h1 id="preloader-text" style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 3rem; color: #D4AF37; letter-spacing: 0.1em; opacity: 0; transform: translateY(20px);">ROYAL STRIKERS</h1>
    </div>
'''

if 'id="preloader"' not in html:
    html = html.replace('<body>', '<body>\n' + preloader)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Added preloader to index.html")
