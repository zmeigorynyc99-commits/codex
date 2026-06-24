from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import html, json, re, urllib.parse
ROOT=Path(__file__).resolve().parents[1]
LESSONS=sorted((ROOT/'lessons').glob('*.md'))
def md_to_html(text):
    out=[]; in_code=False
    for line in text.splitlines():
        if line.startswith('```'):
            out.append('</code></pre>' if in_code else '<pre><code>'); in_code=not in_code; continue
        if in_code: out.append(html.escape(line)); continue
        if line.startswith('#'):
            n=len(line)-len(line.lstrip('#')); out.append(f'<h{n}>'+html.escape(line[n:].strip())+f'</h{n}>')
        elif line.startswith('- '): out.append('<ul><li>'+html.escape(line[2:])+'</li></ul>')
        elif re.match(r'\d+\. ', line): out.append('<ol><li>'+html.escape(re.sub(r'^\d+\. ','',line))+'</li></ol>')
        elif line.strip(): out.append('<p>'+html.escape(line)+'</p>')
        else: out.append('')
    return '\n'.join(out)
def page(title, body):
    nav=''.join(f'<li><a href="/lesson/{p.name}">{p.stem}</a></li>' for p in LESSONS)
    return f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><link rel="stylesheet" href="/style.css"></head><body><aside><h2>Botera Course</h2><a href="/">Home</a><ol>{nav}</ol></aside><main>{body}</main></body></html>'.encode()
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        path=urllib.parse.unquote(self.path)
        if path=='/style.css':
            self.send_response(200); self.send_header('Content-Type','text/css'); self.end_headers(); self.wfile.write((ROOT/'site'/'style.css').read_bytes()); return
        if path.startswith('/lesson/'):
            name=Path(path.split('/lesson/',1)[1]).name; f=ROOT/'lessons'/name
            if f.exists(): body=md_to_html(f.read_text()); self.send_response(200); self.send_header('Content-Type','text/html'); self.end_headers(); self.wfile.write(page(name, body)); return
        home=md_to_html((ROOT/'botera.md').read_text())+'<h2>First 10 lessons</h2><p>Select a lesson from the navigation.</p>'
        self.send_response(200); self.send_header('Content-Type','text/html'); self.end_headers(); self.wfile.write(page('Botera Course', home))
ThreadingHTTPServer(('0.0.0.0',8080),H).serve_forever()
