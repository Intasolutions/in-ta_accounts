import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from django.conf import settings
import io

SCOPES = ['https://www.googleapis.com/auth/drive']

from google.oauth2.credentials import Credentials

def get_drive_service():
    token_path = os.path.join(settings.BASE_DIR, 'token.json')
    if not os.path.exists(token_path):
        raise Exception("token.json not found! Please run setup_gdrive.py first.")
    
    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    service = build('drive', 'v3', credentials=creds)
    return service

def get_or_create_folder(service, folder_name, parent_id):
    # Search for the folder
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed=false"
    results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
    items = results.get('files', [])

    if not items:
        # Create folder
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')
    else:
        return items[0].get('id')

def upload_receipt_to_drive(file_obj, filename, payee_name):
    service = get_drive_service()
    root_folder_id = getattr(settings, 'GOOGLE_DRIVE_ROOT_FOLDER_ID', None)
    
    if not root_folder_id:
        raise Exception("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured in settings.py.")

    # Sanitize payee name for folder
    safe_payee_name = "".join([c if c.isalnum() else "_" for c in payee_name]).strip("_")
    if not safe_payee_name:
        safe_payee_name = "Unknown_Payee"
        
    # Get or create payee folder
    payee_folder_id = get_or_create_folder(service, safe_payee_name, root_folder_id)
    
    # Upload file
    file_metadata = {
        'name': filename,
        'parents': [payee_folder_id]
    }
    
    media = MediaIoBaseUpload(io.BytesIO(file_obj.read()), mimetype=file_obj.content_type, resumable=True)
    
    uploaded_file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink'
    ).execute()
    
    file_id = uploaded_file.get('id')
    
    # Make the file viewable by anyone with the link
    permission = {
        'type': 'anyone',
        'role': 'reader',
    }
    service.permissions().create(fileId=file_id, body=permission).execute()
    
    return uploaded_file.get('webViewLink')
