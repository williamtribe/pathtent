"""In-memory session store for patent generation workflow.

This is a simple implementation suitable for single-instance deployments.
For production with multiple instances, replace with Redis or database storage.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any


@dataclass
class Session:
    """Session data for patent generation workflow."""

    id: str
    original_text: str
    summary: str = ""
    questions: list[dict[str, Any]] = field(default_factory=list)
    answers: dict[str, str] = field(default_factory=dict)
    specification: dict[str, Any] | None = None
    status: str = "pending"  # pending | analyzed | generating | completed | expired
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class SessionStore:
    """In-memory session storage with automatic expiration."""

    def __init__(self, ttl_hours: int = 24):
        self._sessions: dict[str, Session] = {}
        self._ttl = timedelta(hours=ttl_hours)

    def create(self, original_text: str) -> Session:
        """Create a new session."""
        session_id = str(uuid.uuid4())
        session = Session(
            id=session_id,
            original_text=original_text,
            status="pending",
        )
        self._sessions[session_id] = session
        self._cleanup_expired()
        return session

    def get(self, session_id: str) -> Session | None:
        """Get session by ID, returns None if expired or not found."""
        self._cleanup_expired()
        session = self._sessions.get(session_id)
        if session and self._is_expired(session):
            session.status = "expired"
            del self._sessions[session_id]
            return None
        return session

    def update(self, session_id: str, **kwargs: Any) -> Session | None:
        """Update session attributes."""
        session = self.get(session_id)
        if not session:
            return None

        for key, value in kwargs.items():
            if hasattr(session, key):
                setattr(session, key, value)

        session.updated_at = datetime.now()
        return session

    def delete(self, session_id: str) -> bool:
        """Delete a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def _is_expired(self, session: Session) -> bool:
        """Check if session has expired."""
        return datetime.now() - session.created_at > self._ttl

    def _cleanup_expired(self) -> None:
        """Remove expired sessions."""
        expired_ids = [
            sid for sid, session in self._sessions.items() if self._is_expired(session)
        ]
        for sid in expired_ids:
            del self._sessions[sid]


# Global session store instance
session_store = SessionStore(ttl_hours=24)
