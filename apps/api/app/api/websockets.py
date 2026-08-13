import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from app.core.fact_bus import fact_bus

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/fact-bus/{session_id}")
async def websocket_fact_bus_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        # Send initial state snapshot
        await websocket.send_json({
            "type": "SNAPSHOT",
            "session": fact_bus.to_dict()
        })

        while True:
            # Keepalive / listen for client actions
            data = await websocket.receive_text()
            cmd = json.loads(data) if data else {}
            if cmd.get("action") == "PING":
                await websocket.send_json({"type": "PONG", "session": fact_bus.to_dict()})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
