"""
Servidor local do gerador de cronograma (só para testes em localhost).

O front (src/consultoria.jsx) chama http://localhost:8000 quando o app roda em localhost.
Em produção ele usa a API do Render, então este arquivo não afeta o deploy.

Uso (na raiz do projeto):
    pip install -r requirements.txt
    python api/servidor_local.py
"""
from http.server import HTTPServer
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar_cronograma import handler

if __name__ == '__main__':
    porta = 8000
    print(f'Cronograma API local em http://localhost:{porta}  (Ctrl+C para parar)')
    HTTPServer(('127.0.0.1', porta), handler).serve_forever()
