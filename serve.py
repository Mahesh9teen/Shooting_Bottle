"""Simple local server to serve the game folder and open the browser."""
import http.server
import socketserver
import webbrowser
import threading
import os

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server(start_port=PORT, max_tries=10):
    os.chdir(os.path.dirname(__file__) or '.')
    port = start_port
    for _ in range(max_tries):
        try:
            # allow quick reuse of the address
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", port), QuietHandler) as httpd:
                url = f'http://localhost:{port}/'
                print(f"Serving at {url}")
                # open browser once server is bound
                webbrowser.open(url)
                httpd.serve_forever()
                return
        except OSError as e:
            print(f"Port {port} unavailable: {e}")
            port += 1
    print(f"Failed to bind a server after trying {max_tries} ports starting at {start_port}.")

if __name__ == '__main__':
    run_server()
