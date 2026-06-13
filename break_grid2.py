import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

luxury_layout = '''
          <div class="luxury-editorial">
              <div class="editorial-block left">
                  <div class="img-wrapper" data-scroll>
                      <img src="images/volleyball images(in main page)/WhatsApp Image 2026-06-12 at 16.52.00.jpeg" alt="Volleyball game" loading="lazy">
                  </div>
                  <div class="text-content">
                      <h3 class="stagger-text">INTENSE MATCHES</h3>
                      <p>Action-packed volleyball competitions across school and college levels. Experience raw athleticism and unwavering dedication on the court.</p>
                  </div>
              </div>

              <div class="editorial-block right" style="margin-top: 10rem;">
                  <div class="img-wrapper" data-scroll>
                      <img src="images/volleyball images(in main page)/WhatsApp Image 2026-06-12 at 16.52.01.jpeg" alt="Volleyball action" loading="lazy">
                  </div>
                  <div class="text-content">
                      <h3 class="stagger-text">EPIC PLAYS</h3>
                      <p>Witness incredible spikes, blocks, and teamwork. Our players redefine the boundaries of competitive sportsmanship.</p>
                  </div>
              </div>

              <div class="editorial-block left" style="margin-top: 10rem;">
                  <div class="img-wrapper" data-scroll>
                      <img src="images/volleyball images(in main page)/WhatsApp Image 2026-06-12 at 16.52.02.jpeg" alt="Volleyball team" loading="lazy">
                  </div>
                  <div class="text-content">
                      <h3 class="stagger-text">TEAM SPIRIT</h3>
                      <p>Build lasting memories and compete for the ultimate prize. Brotherhood and strategy are the keys to our dynasty.</p>
                  </div>
              </div>
          </div>
'''

html = re.sub(r'<div class="cards">.*?</section>', luxury_layout + '\n      </section>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html")
