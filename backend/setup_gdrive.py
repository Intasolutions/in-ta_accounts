import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from django.conf import settings

SCOPES = ['https://www.googleapis.com/auth/drive']

def setup_credentials():
    creds = None
    token_path = 'token.json'
    client_secrets_path = 'client_secrets.json'

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secrets_path):
                print(f"Error: {client_secrets_path} not found.")
                print("Please download your OAuth 2.0 Client ID JSON from Google Cloud Console and save it as client_secrets.json")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_path, SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
            
    print("Authentication successful! token.json has been saved.")
    return creds

if __name__ == '__main__':
    setup_credentials()
