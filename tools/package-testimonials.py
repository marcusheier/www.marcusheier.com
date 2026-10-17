#!/usr/bin/env python3
"""Create an explicit public-only upload package; never publish or include demo/admin source."""
import argparse, re, shutil, json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
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
shutil.copytree(root/'site', out, ignore=shutil.ignore_patterns('google-apps-script','.DS_Store','.git'))
(out/'js/testimonial-config.js').write_text('window.TESTIMONIAL_CONFIG = Object.freeze('+json.dumps({'publicUrl':a.public_url,'studioUrl':a.studio_url})+');\n')
print('Prepared public-only website files in',out)
print('Nothing was uploaded. Keep the previous live website snapshot for rollback.')
