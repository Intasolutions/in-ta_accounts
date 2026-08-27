import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from finance.gdrive import upload_receipt_to_drive
import io

class MockFile:
    def __init__(self, content):
        self.content = content
        self.content_type = 'text/plain'
    
    def read(self):
        return self.content

f = MockFile(b"test content")

try:
    link = upload_receipt_to_drive(f, "test_file.txt", "Test Payee")
    print("SUCCESS: Link is", link)
except Exception as e:
    import traceback
    traceback.print_exc()
