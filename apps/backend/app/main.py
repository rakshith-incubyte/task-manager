from fastapi import FastAPI

app = FastAPI(
    title="Task Manager API",
    description="A task management API built with FastAPI",
    version="0.1.0"
)


@app.get("/")
async def root():
    """Root endpoint to verify API is running"""
    return {"message": "Hello, World!"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
