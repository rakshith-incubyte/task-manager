# Users Module Tests

Comprehensive test suite for the users module covering all layers.

## 📊 Test Coverage

### Test Files:
1. **`test_validations.py`** - Validation functions
2. **`test_schemas.py`** - Pydantic models
3. **`test_repository.py`** - Data access layer
4. **`test_service.py`** - Business logic layer
5. **`test_router.py`** - API endpoints

---

## 🧪 Running Tests

### Run all user tests:
```bash
poetry run pytest app/modules/users/tests/ -v
```

### Run specific test file:
```bash
poetry run pytest app/modules/users/tests/test_service.py -v
```

### Run with coverage:
```bash
poetry run pytest app/modules/users/tests/ --cov=app.modules.users --cov-report=term-missing
```

---

## 📝 Test Summary

### **test_validations.py** (16 tests)
- ✅ Valid username formats (lowercase, uppercase, mixed, numbers, underscores)
- ✅ Invalid username formats (spaces, special chars, hyphens)
- ✅ Valid passwords (all requirements met)
- ✅ Invalid passwords (missing uppercase, lowercase, special chars)

### **test_schemas.py** (24 tests)
- ✅ UserCreate validation (username, email, password)
- ✅ Field length constraints (min/max)
- ✅ UserResponse creation
- ✅ UserUpdate optional fields
- ✅ Validation inheritance

### **test_repository.py** (16 tests)
- ✅ CRUD operations (create, read, update, delete)
- ✅ Query operations (by username, by email)
- ✅ Get all users
- ✅ Edge cases (nonexistent users, empty database)

### **test_service.py** (15 tests)
- ✅ User registration with validation
- ✅ Duplicate username/email detection
- ✅ User retrieval and listing
- ✅ User updates with business rules
- ✅ User deletion
- ✅ HTTP exception handling

### **test_router.py** (14 tests)
- ✅ POST /users/ - Create user
- ✅ GET /users/{id} - Get user
- ✅ GET /users/ - List users
- ✅ PUT /users/{id} - Update user
- ✅ DELETE /users/{id} - Delete user
- ✅ Validation errors (422)
- ✅ Business logic errors (400, 404)

---

## 🎯 Test Patterns Used

### 1. **Fixtures for Test Isolation**
```python
@pytest.fixture
def temp_json_file():
    """Each test gets its own temporary database."""
    fd, path = tempfile.mkstemp(suffix='.json')
    yield path
    os.unlink(path)
```

### 2. **Dependency Injection in Tests**
```python
@pytest.fixture
def service(temp_json_file):
    db = JSONPersistence(temp_json_file)
    repository = UserRepository(db)
    return UserService(repository)
```

### 3. **Testing Exceptions**
```python
def test_duplicate_username(service):
    with pytest.raises(HTTPException) as exc_info:
        service.register_user(duplicate_data)
    assert exc_info.value.status_code == 400
```

### 4. **API Testing with TestClient**
```python
def test_create_user(client):
    response = client.post("/users/", json={...})
    assert response.status_code == 201
```

---

## ✅ What's Tested

### Validation Layer:
- ✅ Username format rules
- ✅ Password strength rules
- ✅ Edge cases and error messages

### Schema Layer:
- ✅ Field validation
- ✅ Type checking
- ✅ Optional fields
- ✅ Inheritance

### Repository Layer:
- ✅ CRUD operations
- ✅ Query operations
- ✅ Data transformation
- ✅ Edge cases

### Service Layer:
- ✅ Business rules (uniqueness)
- ✅ Password hashing
- ✅ ID generation
- ✅ Error handling

### Router Layer:
- ✅ HTTP status codes
- ✅ Request/response format
- ✅ Validation errors
- ✅ End-to-end flows

---

## 📊 Expected Coverage

- **Validations:** 100%
- **Schemas:** 95%+ (Pydantic internals excluded)
- **Repository:** 100%
- **Service:** 100%
- **Router:** 95%+ (FastAPI internals excluded)

---

## 🔍 Test Organization

```
tests/
├── __init__.py
├── README.md              # This file
├── test_validations.py    # 16 tests - Validation functions
├── test_schemas.py        # 24 tests - Pydantic models
├── test_repository.py     # 16 tests - Data access
├── test_service.py        # 15 tests - Business logic
└── test_router.py         # 14 tests - API endpoints

Total: 85 tests
```

---

## 🎓 Key Testing Principles

1. **Test Isolation** - Each test uses temporary database
2. **Arrange-Act-Assert** - Clear test structure
3. **One Assertion Per Test** - Focused tests
4. **Descriptive Names** - `test_create_user_duplicate_username`
5. **Edge Cases** - Empty, None, nonexistent
6. **Happy Path + Error Path** - Both scenarios tested

---

## 🚀 Running Specific Test Categories

```bash
# Validation tests only
pytest app/modules/users/tests/test_validations.py -v

# Schema tests only
pytest app/modules/users/tests/test_schemas.py -v

# Repository tests only
pytest app/modules/users/tests/test_repository.py -v

# Service tests only
pytest app/modules/users/tests/test_service.py -v

# API tests only
pytest app/modules/users/tests/test_router.py -v

# All tests with coverage
pytest app/modules/users/tests/ --cov=app.modules.users --cov-report=html
```
