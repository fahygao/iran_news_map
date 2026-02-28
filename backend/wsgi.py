"""WSGI entry point for PythonAnywhere deployment.

In PythonAnywhere Web App config, set the WSGI file path to point here
and update the path below to match your actual home directory.
"""

import sys
import os

# Update this path to match your PythonAnywhere home directory
project_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_path)
os.chdir(project_path)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_path, ".env"))

from app import app as application  # noqa: E402
