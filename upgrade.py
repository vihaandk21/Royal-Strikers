import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Insert :root variables right after the comment block
root_vars = '''
:root {
    --gold-primary: #D4AF37; /* Premium Gold */
    --gold-glow: rgba(212, 175, 55, 0.4);
    --bg-dark: #050505;
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: 1px solid rgba(212, 175, 55, 0.15);
    --font-display: 'Outfit', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
}
'''
css = css.replace('*/\n\n/* ──', '*/\n' + root_vars + '\n/* ──')

# 2. Global replacements
css = re.sub(r'(?i)#FFD700', 'var(--gold-primary)', css)
css = re.sub(r'(?i)#070707', 'var(--bg-dark)', css)
css = css.replace('font-family: Poppins, sans-serif;', 'font-family: var(--font-body);')

# 3. Typography Upgrades
css = css.replace('.hero h1 {\\n    font-size: 85px;\\n    font-weight: 800;\\n}', 
                  '.hero h1 {\\n    font-family: var(--font-display);\\n    font-size: 85px;\\n    font-weight: 800;\\n    letter-spacing: -0.02em;\\n}')
css = css.replace('.title {\\n    text-align: center;\\n    font-size: 45px;\\n    color: var(--gold-primary);\\n    margin-bottom: 50px;\\n}', 
                  '.title {\\n    font-family: var(--font-display);\\n    text-align: center;\\n    font-size: 45px;\\n    color: var(--gold-primary);\\n    margin-bottom: 50px;\\n    letter-spacing: -0.02em;\\n}')

# 4. Glassmorphism Upgrades
# Navbar
css = css.replace('background: rgba(0, 0, 0, .4);\\n    backdrop-filter: blur(10px);', 
                  'background: rgba(5, 5, 5, 0.7);\\n    backdrop-filter: blur(16px);\\n    border-bottom: 1px solid rgba(255,255,255,0.05);')

# Cards
css = css.replace('background: #111;\\n    padding: 30px;\\n    border-radius: 10px;\\n    text-align: center;\\n    transition: .3s;',
                  'background: var(--glass-bg);\\n    backdrop-filter: blur(10px);\\n    border: var(--glass-border);\\n    padding: 30px;\\n    border-radius: 16px;\\n    text-align: center;\\n    transition: 0.3s ease-out;\\n    box-shadow: 0 10px 30px rgba(0,0,0,0.5);')
css = css.replace('.card:hover {\\n    transform: translateY(-10px);\\n}',
                  '.card:hover {\\n    transform: translateY(-10px);\\n    box-shadow: 0 15px 40px var(--gold-glow);\\n    border: 1px solid rgba(212, 175, 55, 0.4);\\n}')

# Buttons
css = css.replace('.primary {\\n    background: var(--gold-primary);\\n    color: black;\\n}',
                  '.primary {\\n    background: linear-gradient(135deg, #FACC15, #D4AF37);\\n    color: black;\\n    box-shadow: 0 4px 15px var(--gold-glow);\\n    border: none;\\n}\\n.primary:hover {\\n    box-shadow: 0 8px 25px var(--gold-glow);\\n}')

# Form Container
css = css.replace('.form-container {\\n    background: #111;\\n    padding: 40px;\\n    border-radius: 12px;\\n    max-width: 600px;\\n    margin: 0 auto;\\n}',
                  '.form-container {\\n    background: var(--glass-bg);\\n    backdrop-filter: blur(16px);\\n    border: var(--glass-border);\\n    padding: 40px;\\n    border-radius: 16px;\\n    max-width: 600px;\\n    margin: 0 auto;\\n    box-shadow: 0 20px 50px rgba(0,0,0,0.5);\\n}')

# Inputs
css = css.replace('background: #222;\\n    border: 1px solid #333;\\n    color: white;',
                  'background: rgba(0,0,0,0.3);\\n    border: 1px solid rgba(255,255,255,0.1);\\n    color: white;\\n    transition: 0.3s;')
css = css.replace('.form-group input:focus,\\n.form-group select:focus {\\n    border-color: var(--gold-primary);\\n    outline: none;\\n}',
                  '.form-group input:focus,\\n.form-group select:focus {\\n    border-color: var(--gold-primary);\\n    outline: none;\\n    box-shadow: 0 0 10px var(--gold-glow);\\n    background: rgba(0,0,0,0.5);\\n}')

# Receipt Wrapper
css = css.replace('.rc-wrapper {\\n    background: #000;\\n    color: #fff;',
                  '.rc-wrapper {\\n    background: #050505;\\n    color: #fff;')

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Upgrade complete")
