import re
import glob

preloader = '''
    <!-- Cinematic Preloader -->
    <div id="preloader" style="position: fixed; inset: 0; background: #050505; z-index: 99999; display: flex; align-items: center; justify-content: center;">
        <h1 id="preloader-text" style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 3rem; color: #D4AF37; letter-spacing: 0.1em; opacity: 0; transform: translateY(20px);">ROYAL STRIKERS</h1>
    </div>
'''

for file in glob.glob('*.html'):
    if file == 'index.html': continue
    with open(file, 'r', encoding='utf-8') as f:
        html = f.read()
    if 'id="preloader"' not in html:
        html = html.replace('<body>', '<body>\n' + preloader)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Added preloader to {file}")
