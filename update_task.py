import re

with open('task.md', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('- [ ] **Architecture**:', '- [x] **Architecture**:')
text = text.replace('- [ ] **Styles', '- [x] **Styles')
text = text.replace('- [ ] **Animations', '- [x] **Animations')
text = text.replace('- [ ] **HTML Updates', '- [x] **HTML Updates')

with open('task.md', 'w', encoding='utf-8') as f:
    f.write(text)
