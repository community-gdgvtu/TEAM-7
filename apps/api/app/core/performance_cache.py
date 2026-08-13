import time
from typing import Dict, Any, Optional

class PerformanceCache:
    """
    In-memory LRU / Time-To-Live (TTL) cache for deterministic AI and database operations.
    Prevents redundant LLM calls and speeds up repeated seller discovery queries.
    """
    def __init__(self, ttl_seconds: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def set(self, key: str, data: Any):
        self.cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

    def clear(self):
        self.cache.clear()

ai_cache = PerformanceCache(ttl_seconds=600)
discovery_cache = PerformanceCache(ttl_seconds=300)
