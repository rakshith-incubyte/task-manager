# Task Manager Backend

A clean, maintainable FastAPI backend following **strict SOLID principles** and clean architecture

## Features

- ✅ **User Management** - Complete CRUD operations with authentication
- ✅ **Task Management** - Create, read, update, delete tasks with owner tracking
- ✅ **Health Checks** - System health monitoring
- ✅ **Database Integration** - SQLAlchemy ORM with SQLite
- ✅ **Testing** - Comprehensive test coverage with pytest
- ✅ **API Documentation** - Auto-generated Swagger/ReDoc docs

## Project Structure

```mermaid
graph LR
    subgraph app["app/"]
        main["main.py"]
        
        subgraph core["core/"]
            config["config.py"]
            interfaces["interfaces.py"]
            logger["logger.py"]
            modules["modules.py"]
        end
        
        subgraph mods["modules/"]
            subgraph health["health/"]
                h_init["__init__.py"]
                h_router["router.py"]
                h_schemas["schemas.py"]
                subgraph h_tests["tests/"]
                    h_test_init["__init__.py"]
                    h_test["test_health.py"]
                end
            end
            
            subgraph users["users/"]
                u_init["__init__.py"]
                u_router["router.py"]
                u_service["service.py"]
                u_repository["repository.py"]
                u_models["models.py"]
                u_schemas["schemas.py"]
                u_interfaces["interfaces.py"]
                u_validations["validations.py"]
                subgraph u_tests["tests/"]
                    u_test_router["test_router.py"]
                    u_test_service["test_service.py"]
                    u_test_repository["test_repository.py"]
                    u_test_schemas["test_schemas.py"]
                    u_conftest["conftest.py"]
                end
            end
            
            subgraph tasks["tasks/"]
                t_init["__init__.py"]
                t_router["router.py"]
                t_service["service.py"]
                t_repository["repository.py"]
                t_models["models.py"]
                t_schemas["schemas.py"]
                t_interfaces["interfaces.py"]
                subgraph t_tests["tests/"]
                    t_test_router["test_router.py"]
                    t_conftest["conftest.py"]
                end
            end
        end
    end
    
    subgraph tests["tests/"]
        test_app["test_app_initialization.py"]
        test_logger["test_logger.py"]
        test_loader["test_module_loader.py"]
        test_interfaces["test_interfaces.py"]
        test_database["test_database.py"]
    end
    
    style app fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px
    style core fill:#E3F2FD,stroke:#2196F3,stroke-width:2px
    style mods fill:#FFF3E0,stroke:#FF9800,stroke-width:2px
    style health fill:#FFE0B2,stroke:#FF9800,stroke-width:1px
    style users fill:#FFE0B2,stroke:#FF9800,stroke-width:1px
    style tasks fill:#FFE0B2,stroke:#FF9800,stroke-width:1px
    style h_tests fill:#F3E5F5,stroke:#9C27B0,stroke-width:1px
    style u_tests fill:#F3E5F5,stroke:#9C27B0,stroke-width:1px
    style t_tests fill:#F3E5F5,stroke:#9C27B0,stroke-width:1px
    style tests fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px
```

## Architecture Principles

### Modular Architecture (Django-Style)
- **Self-contained modules**: Each feature is a separate module
- **Easy to add/remove**: Just add to `INSTALLED_MODULES` list
- **Independent development**: Teams can work on different modules
- **Clear boundaries**: Each module owns its domain

### SOLID Principles (100% Compliance)

#### 1. Single Responsibility Principle (SRP)
- Each class/function has **one reason to change**
- `ModuleLoader` has focused methods: `import_module()`, `validate_module()`, `register_module()`
- `configure_cors()` only handles CORS configuration
- Separate concerns throughout the codebase

#### 2. Open/Closed Principle (OCP)
- **Open for extension**: Add new modules to `INSTALLED_MODULES`
- **Closed for modification**: No code changes needed to add features
- Module-based architecture allows seamless extension

#### 3. Liskov Substitution Principle (LSP)
- Formal **Protocol** definitions (`LoggerProtocol`, `ModuleProtocol`)
- All implementations are substitutable
- Type-safe with runtime validation

#### 4. Interface Segregation Principle (ISP)
- Minimal, focused interfaces
- `LoggerProtocol`: only 3 methods (info, warning, error)
- `ModuleProtocol`: only 1 attribute (router)
- No fat interfaces

#### 5. Dependency Inversion Principle (DIP)
- **Depend on abstractions**, not concrete implementations
- Full dependency injection in `create_app(config, logger)`
- Settings and logger are injected, not hardcoded
- Easy to test with mock dependencies

## Setup

### Install Dependencies

```bash
poetry install
```

### Database Setup

```bash
# Initialize database (creates tables)
poetry run python -c "from app.core.database import init_db; init_db()"
```

### Run Development Server

```bash
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Database Migrations (Alembic)

```bash
# Create a new migration (auto-detects model changes)
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

**Note**: Migrations are located at `app/core/alembic/`. Models are automatically discovered from modules in `INSTALLED_MODULES`.

### Run Tests

```bash
# Run all tests with coverage
poetry run pytest --cov

# Run specific module tests
poetry run pytest app/modules/users/tests/ --cov=app.modules.users -v
poetry run pytest app/modules/tasks/tests/ --cov=app.modules.tasks -v

# Run core tests
poetry run pytest tests/ -v

# View coverage report
poetry run pytest --cov --cov-report=html
open htmlcov/index.html
```

## API Documentation

Once the server is running:

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Environment Configuration

Create a `.env` file in the backend directory:

```env
# Application Settings
APP_NAME="Task Manager API"
APP_DESCRIPTION="A task management API built with FastAPI"
APP_VERSION="0.1.0"
DEBUG=false

# Database Configuration
DATABASE_URL="sqlite:///./data/task_manager.db"
DATABASE_ECHO=false

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "https://myapp.com"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]
```

**Configuration Features:**
- **Database**: SQLite by default, easily switch to PostgreSQL/MySQL
- **CORS**: Configurable for production/development
- **Debug Mode**: Toggle detailed error messages
- No code changes needed - just update `.env`

## Adding New Modules

### 1. Create Module Directory

```bash
mkdir -p app/modules/users
```

### 2. Create Module Files

```python
# app/modules/users/__init__.py
"""Users feature module."""
from app.modules.users.router import router
__all__ = ["router"]

# app/modules/users/schemas.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str

class UserResponse(UserCreate):
    id: int
    class Config:
        from_attributes = True

# app/modules/users/router.py
from fastapi import APIRouter
from app.modules.users.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    return UserResponse(id=1, **user.model_dump())
```

### 3. Register Module

```python
# app/config.py
INSTALLED_MODULES = [
    "app.modules.health",
    "app.modules.users",
    "app.modules.tasks",
    "app.modules.your_module",  # Add your new module
]
```

### 4. Write Tests

```python
# app/modules/users/tests/__init__.py
"""Tests for users module."""

# app/modules/users/tests/test_users.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user():
    response = client.post("/users/", json={"username": "test", "email": "test@example.com"})
    assert response.status_code == 201
```

That's it! The module will be automatically registered when the app starts.

## Running Tests

```bash
# Run all tests (including module tests)
pytest -v

# Run only app-level tests
pytest tests/ -v

# Run only module tests
pytest app/modules/ -v

# Run specific module tests
pytest app/modules/health/tests/ -v
```

## 🧪 Testing & Dependency Injection

### Testing with Custom Configuration

```python
from app.main import create_app
from app.core.config import Settings
from app.core.logger import NullLogger

# Test with custom config
test_config = Settings(
    app_name="Test API",
    debug=True,
    cors_origins=["http://localhost:3000"]
)

# Inject dependencies
test_app = create_app(
    config=test_config,      # Custom config
    logger=NullLogger()      # Silent logger for tests
)

# Now test the app
assert test_app.title == "Test API"
```

**Benefits of Dependency Injection:**
- ✅ No global state in tests
- ✅ Complete control over configuration
- ✅ Can silence logs with `NullLogger()`
- ✅ Tests are isolated and independent



## 📚 API Endpoints

### Health Module
- `GET /health` - Check API health status

### Users Module
- `POST /users/` - Register new user
- `GET /users/{user_id}` - Get user by ID
- `GET /users/` - Get all users
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

### Tasks Module
- `POST /tasks/` - Create new task (requires `owner` header)
- `GET /tasks/{task_id}` - Get task by ID
- `GET /tasks/` - Get all tasks
- `PUT /tasks/{task_id}` - Update task (requires `owner` header)
- `DELETE /tasks/{task_id}` - Delete task (returns 204 No Content)

## 📚 Additional Documentation

- **[API Documentation](http://127.0.0.1:8000/docs)** - Interactive Swagger UI
- **[ReDoc](http://127.0.0.1:8000/redoc)** - Alternative API documentation

## 🏗️ Architecture Overview

```mermaid
graph TD
    App[FastAPI Application<br/>Dependency Injection]
    Settings[Settings<br/>injected]
    Logger[Logger<br/>injected]
    Loader[ModuleLoader<br/>DI]
    
    Health[Health Module]
    Tasks[Tasks Module]
    Users[Users Module]
    
    Protocol[ModuleProtocol<br/>- router: APIRouter]
    
    App --> Settings
    App --> Logger
    App --> Loader
    
    Loader --> Health
    Loader --> Tasks
    Loader --> Users
    
    Health -.implements.-> Protocol
    Tasks -.implements.-> Protocol
    Users -.implements.-> Protocol
    
    style App fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style Settings fill:#2196F3,stroke:#1565C0,color:#fff
    style Logger fill:#2196F3,stroke:#1565C0,color:#fff
    style Loader fill:#2196F3,stroke:#1565C0,color:#fff
    style Health fill:#FF9800,stroke:#E65100,color:#fff
    style Tasks fill:#FF9800,stroke:#E65100,color:#fff
    style Users fill:#FF9800,stroke:#E65100,color:#fff
    style Protocol fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

**Key Points:**
- All dependencies flow **downward** (Dependency Inversion)
- Modules are **pluggable** (Open/Closed)
- Each module is **independent** (Single Responsibility)
- All modules follow **same protocol** (Liskov Substitution)

## 🎓 Key Learnings

### Dependency Injection Pattern

**Before:**
```python
def create_app():
    app = FastAPI(...)
    app.add_middleware(CORSMiddleware, allow_origins=["*"])  # Hardcoded!
    return app
```

**After:**
```python
def create_app(
    config: Optional[Settings] = None,
    logger: Optional[LoggerProtocol] = None
):
    config = config or default_settings
    logger = logger or default_logger
    
    app = FastAPI(title=config.app_name, ...)  # From config
    configure_cors(app, config)  # Configurable
    register_modules(app, logger=logger)  # Logger injected
    return app
```

### Protocol Pattern (Interface)

```python
# Define interface
class LoggerProtocol(Protocol):
    def info(self, message: str) -> None: ...
    def warning(self, message: str) -> None: ...
    def error(self, message: str) -> None: ...

# Implementations
class ConsoleLogger:  # Production
    def info(self, message: str) -> None:
        logging.info(message)

class NullLogger:  # Testing
    def info(self, message: str) -> None:
        pass  # Do nothing
```

## 🚀 Quick Start

```bash
# Install dependencies
poetry install

# Run tests
poetry run pytest -v

# Start development server
poetry run uvicorn app.main:app --reload

# View API docs
open http://127.0.0.1:8000/docs
```
