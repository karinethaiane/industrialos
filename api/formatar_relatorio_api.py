import json
import subprocess
import sys
import tempfile
from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMATTER = ROOT / 'formatar_relatorio.py'
HOST = '127.0.0.1'
PORT = 8001


class FormatarRelatorioHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_error(self, status, message):
        body = json.dumps({'error': message}).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/formatar-relatorio':
            self._send_error(404, 'Rota não encontrada.')
            return

        content_type = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in content_type:
            self._send_error(400, 'Envie um arquivo multipart/form-data.')
            return

        length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(length)

        parser = BytesParser(policy=default)
        message = parser.parsebytes(f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8') + body)

        uploaded = None
        filename = 'relatorio_bruto.xlsx'
        for part in message.iter_parts():
            if part.get_filename():
                uploaded = part.get_payload(decode=True)
                filename = part.get_filename()
                break

        if uploaded is None:
            self._send_error(400, 'Nenhum arquivo foi enviado.')
            return

        if not FORMATTER.exists():
            self._send_error(500, f'Arquivo não encontrado: {FORMATTER}')
            return

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                temp_dir = Path(tmpdir)
                raw_path = temp_dir / filename
                raw_path.write_bytes(uploaded)
                output_path = temp_dir / f'{raw_path.stem}_formatado.xlsx'

                subprocess.run(
                    [sys.executable, str(FORMATTER), str(raw_path), str(output_path)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                payload = output_path.read_bytes()

            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition', f'attachment; filename="{output_path.name}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or '').strip() or str(exc)
            self._send_error(500, f'Formato do relatório falhou: {stderr}')
        except Exception as exc:
            self._send_error(500, str(exc))


if __name__ == '__main__':
    server = HTTPServer((HOST, PORT), FormatarRelatorioHandler)
    print(f'Formato de relatório em http://{HOST}:{PORT}/formatar-relatorio')
    server.serve_forever()
