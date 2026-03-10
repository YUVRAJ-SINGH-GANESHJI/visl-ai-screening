"""
Run this script locally to generate token.pickle with Calendar + Gmail scopes.
Usage:  python generate_token.py
It will open a browser for Google login, then save token.pickle in this folder.
"""
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from pathlib import Path

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
]

CREDENTIALS_FILE = str(Path(__file__).parent / "credentials.json")
TOKEN_FILE = str(Path(__file__).parent / "token.pickle")

flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
creds = flow.run_local_server(port=8080)

with open(TOKEN_FILE, "wb") as f:
    pickle.dump(creds, f)

print(f"\n✅ token.pickle saved to {TOKEN_FILE}")
print("You can now restart uvicorn — Gmail API + Calendar will work.")
