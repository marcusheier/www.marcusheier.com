#!/usr/bin/env python3
"""Create an explicit public-only upload package; never publish or include demo/admin source."""
import argparse, re, shutil, json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--public-url', required=True)
p.add_argument('--studio-url', required=True)
p.add_argument('--output', required=True)
p.add_argument('--google-checks-passed', action='store_true', help='Attest that the deployment checklist has passed before packaging')
a = p.parse_args()
if not a.google_checks_passed: p.error('Complete the Google acceptance checklist first; local tests do not verify deployment.')
for url in [a.public_url,a.studio_url]:
 if not re.fullmatch(r'https://script\.google\.com/macros/s/[\w-]+/exec',url): p.error('Expected a Google Apps Script /exec URL')
if a.public_url == a.studio_url: p.error('Public and owner apps must be separate deployments in separate projects')
out = Path(a.output).resolve()
if out.exists(): p.error('Output must be a new directory; existing files are never overwritten')
if out == root or root in out.parents: p.error('Choose an output directory outside the source project, such as /private/tmp/testimonial-upload')
site = root/'site' if (root/'site').is_dir() else root
out.mkdir()
# Explicit allowlist works in both this workspace and the repository's root-site layout.
for name in ['assets','css','js','logo','testimonials','testimonials-studio-432']:
 if (site/name).is_dir(): shutil.copytree(site/name,out/name,ignore=shutil.ignore_patterns('.DS_Store','.git'))
for name in ['index.html','about.html','services.html','contact.html','8week.html','event-w45.html','course.html','style.css','favicon.ico','favicon.png','CNAME']:
 if (site/name).is_file(): shutil.copy2(site/name,out/name)
if not (out/'CNAME').exists(): (out/'CNAME').write_text('www.marcusheier.com\n')
(out/'js/testimonial-config.js').write_text('window.TESTIMONIAL_CONFIG = Object.freeze('+json.dumps({'publicUrl':a.public_url,'studioUrl':a.studio_url})+');\n')
print('Prepared public-only website files in',out)
print('Nothing was uploaded. Keep the previous live website snapshot for rollback.')
