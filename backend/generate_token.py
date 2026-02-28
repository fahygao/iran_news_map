"""
Run this script ONCE to generate token.json for Gmail API.
Requires credentials.json to be in the same directory.

Usage: python generate_token.py
"""
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH", "./credentials.json")
TOKEN_PATH = os.getenv("GMAIL_TOKEN_PATH", "./token.json")

def main():
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                print(f"Error: {CREDENTIALS_PATH} not found!")
                print("Download it from Google Cloud Console -> Credentials -> OAuth 2.0 Client IDs")
                return
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())
        print(f"Token saved to {TOKEN_PATH}")
    else:
        print("Token already valid!")

if __name__ == "__main__":
    main()
