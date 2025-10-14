"""Health check endpoints."""

from fastapi import APIRouter

from app.modules.health.schemas import HealthResponse, MessageResponse

router = APIRouter()


@router.get("/", response_model=MessageResponse, tags=["Root"])
async def root() -> MessageResponse:
    """Root endpoint to verify API is running."""
    return MessageResponse(message="Hello, World!")


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="healthy")
