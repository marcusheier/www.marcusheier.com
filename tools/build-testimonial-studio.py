#!/usr/bin/env python3
"""Bundle locally maintained CSS/JS into a self-contained Google HTML file and demo."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
src = root / 'integrations/testimonials'
shell = (src / 'studio-shell.html').read_text()
css = '\n'.join((root / p).read_text() for p in ['site/css/testimonials.css','site/css/testimonial-carousel.css','integrations/testimonials/studio.css'])
js = '\n'.join((root / p).read_text() for p in ['site/js/testimonial-carousel.js','integrations/testimonials/graphics.js','integrations/testimonials/studio.js'])
base = shell.replace('<!-- STYLES -->','<style>\n'+css+'\n</style>')
(src / 'studio.html').write_text(base.replace('<!-- SCRIPTS -->','<script>window.STUDIO_REVIEW_ID = <?!= reviewId ?>;</script>\n<script>\n'+js+'\n</script>'))
(src / 'preview.html').write_text(base.replace('<!-- SCRIPTS -->','<script>\n'+(src / 'demo.js').read_text()+'\n'+js+'\n</script>'))
print('Built Google studio.html and local preview.html')
