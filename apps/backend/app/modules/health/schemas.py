"""Health check schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str


class MessageResponse(BaseModel):
    """Generic message response model."""
    
    message: str
