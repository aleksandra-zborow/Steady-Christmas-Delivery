"""Skleja index.html + css + js w jeden plik (steady-christmas-delivery.html).
Uruchom: python3 build-single-file.py   (opcjonalne – do wygodnego udostępniania gry)"""
import re
html = open('index.html', encoding='utf-8').read()
html = re.sub(r'<link rel="stylesheet" href="(.+?)">',
              lambda m: '<style>\n' + open(m.group(1), encoding='utf-8').read() + '\n</style>', html)
html = re.sub(r'<script src="(.+?)"></script>',
              lambda m: '<script>\n' + open(m.group(1), encoding='utf-8').read() + '\n</script>', html)
open('steady-christmas-delivery.html', 'w', encoding='utf-8').write(html)
print('OK: steady-christmas-delivery.html')
