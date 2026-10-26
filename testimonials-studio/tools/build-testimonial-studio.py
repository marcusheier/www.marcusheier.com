#!/usr/bin/env python3
"""Bundle locally maintained CSS/JS into a self-contained Google HTML file and demo."""
from pathlib import Path
import base64
src = Path(__file__).resolve().parents[1]
root = src.parent
site = root / 'site' if (root / 'site').is_dir() else root
shell = (src / 'studio-shell.html').read_text()
css = '\n'.join(p.read_text() for p in [site/'css/testimonials.css',site/'css/testimonial-carousel.css',src/'studio.css'])
js = '\n'.join(p.read_text() for p in [site/'js/testimonial-carousel.js',src/'graphics.js',src/'studio.js'])
js = js.replace('__REFERENCE_PRISM_DATA__', 'data:image/png;base64,' + base64.b64encode((src/'reference-prism.png').read_bytes()).decode())
base = shell.replace('<!-- STYLES -->','<style>\n'+css+'\n</style>')
(src / 'studio.html').write_text(base.replace('<!-- SCRIPTS -->','<script>window.STUDIO_REVIEW_ID = <?!= reviewId ?>;</script>\n<script>\n'+js+'\n</script>'))
(src / 'preview.html').write_text(base.replace('<!-- SCRIPTS -->','<script>\n'+(src / 'demo.js').read_text()+'\n'+js+'\n</script>'))
print('Built Google studio.html and local preview.html')
