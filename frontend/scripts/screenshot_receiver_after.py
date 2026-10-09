import http.server
import socketserver
import base64
import os

PORT = 9876

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length).decode('utf-8')
        if ',' in data:
            data = data.split(',', 1)[1]
        img_bytes = base64.b64decode(data)
        out_path = os.path.join(os.path.dirname(__file__), 'full_map_screenshot_after.png')
        with open(out_path, 'wb') as f:
            f.write(img_bytes)
        print(f"Saved screenshot to {out_path} ({len(img_bytes)} bytes)", flush=True)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b"OK")

if __name__ == '__main__':
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f"Listening on port {PORT}...", flush=True)
        httpd.handle_request()
