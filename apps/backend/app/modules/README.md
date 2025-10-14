# Modules (Django-Style Apps)

This directory contains feature modules, similar to Django's app architecture. Each module is self-contained and independent.

## Module Structure

Each module should follow this structure:

```
modules/
└── module_name/
    ├── __init__.py          # Exports router
    ├── router.py            # API endpoints
    ├── schemas.py           # Pydantic models
    ├── services.py          # Business logic (optional)
    ├── models.py            # Database models (optional)
    └── tests/               # Module-specific tests
        ├── __init__.py
        └── test_module_name.py
```

## Creating a New Module

### 1. Create Module Directory

```bash
mkdir app/modules/users
```

### 2. Create `__init__.py`

```python
"""Users feature module."""

from app.modules.users.router import router

__all__ = ["router"]
```

### 3. Create `schemas.py`

```python
"""User schemas."""

from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True
```

### 4. Create `router.py`

```python
"""User endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List

from app.modules.users.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
async def list_users():
    """List all users."""
    return []

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    """Create a new user."""
    # Implementation here
    pass
```

### 5. Register Module

Add to `app/core/modules.py`:

```python
INSTALLED_MODULES = [
    "app.modules.health",
    "app.modules.tasks",
    "app.modules.users",  # Add your new module
]
```

### 6. Create Tests

```bash
mkdir app/modules/users/tests
```

```python
# app/modules/users/tests/__init__.py
"""Tests for users module."""

# app/modules/users/tests/test_users.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_users():
    response = client.get("/users/")
    assert response.status_code == 200
```

## Existing Modules

### health
- **Purpose**: Health checks and root endpoint
- **Endpoints**: `/`, `/health`
- **No prefix**: Root level endpoints

### tasks
- **Purpose**: Task management (example module)
- **Endpoints**: `/tasks/`, `/tasks/{id}`
- **Prefix**: `/tasks`

## Module Guidelines

1. **Single Responsibility**: Each module handles one feature domain
2. **Self-Contained**: All related code stays within the module
3. **Independent**: Modules should minimize dependencies on each other
4. **Testable**: Each module can be tested independently
5. **Documented**: Include docstrings for all public functions

## Benefits

- ✅ Easy to add/remove features
- ✅ Clear code organization
- ✅ Team members can work on different modules independently
- ✅ Easier to test and maintain
- ✅ Similar to Django's proven architecture
