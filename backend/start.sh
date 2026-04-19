#!/bin/bash
# Activate the virtual environment
source venv/bin/activate

# Run the backend server
python -m uvicorn app.main:app --reload
