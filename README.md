# Drone SAR Simulation

Multi-agent search & rescue simulation with a React dashboard and FastAPI backend.

## Run backend and frontend together

1. **Backend API server** (this is what the frontend connects to):
   - Ensure MongoDB is running (backend uses `MONGO_URL` and `DB_NAME` from `backend/.env`).
   - From `backend/` run the **API server** (not the CLI simulator):
     - **Windows:** `python server.py` or `run_server.bat`
     - **Or:** `uvicorn server:app --reload --host 0.0.0.0 --port 8000`
   - You should see Uvicorn listening on port 8000.  
   - **Note:** `run_sim.py` is a standalone CLI simulation — it does **not** start the API or WebSocket. Use `server.py` for the dashboard.

2. **Frontend** (from project root):
   - From `frontend/`:  
     `yarn start` or `npm start`
   - App: http://localhost:3000  
   - In dev, requests to `/api` and `/ws` are proxied to the backend (see `frontend/package.json` `"proxy"`).

3. **Optional**: Set `REACT_APP_BACKEND_URL=http://localhost:8000` in `frontend/.env` to talk to the backend directly instead of using the proxy.
