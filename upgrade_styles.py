import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Update :root
root_vars_new = '''
:root {
    --gold-primary: #D4AF37;
    --gold-glow: rgba(212, 175, 55, 0.4);
    --crimson-primary: #7A0016; /* Deep Burgundy from photos */
    --crimson-glow: rgba(122, 0, 22, 0.5);
    --bg-dark: #050505;
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: 1px solid rgba(212, 175, 55, 0.15);
    --font-display: 'Outfit', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
}
'''
css = re.sub(r':root\s*\{.*?\}(?=\s*/\*)', root_vars_new.strip(), css, flags=re.DOTALL)

# Add noise overlay to body
if 'body::after' not in css:
    noise_css = '''
body::after {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    z-index: 9999;
}
'''
    css = css.replace('body {', noise_css + '\nbody {')

# Upgrade Buttons to Crimson/Gold gradient
css = re.sub(r'linear-gradient\(135deg,\s*#FACC15,\s*#D4AF37\)', 'linear-gradient(135deg, var(--crimson-primary), #4a000d)', css)

# Fix Primary Button Glow
css = re.sub(r'var\(--gold-glow\)', 'var(--crimson-glow)', css)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Styles updated")
