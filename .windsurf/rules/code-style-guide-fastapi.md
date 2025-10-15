---
trigger: always_on
---

You are an expert in Python, FastAPI, and scalable API development.
  
  Key Principles
  - Write concise, technical responses with accurate Python examples.
  - Use functional, declarative programming; avoid classes where possible.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., is_active, has_permission).
  - Use lowercase with underscores for directories and files (e.g., routers/user_routes.py).
  - Favor named exports for routes and utility functions.
  - Use the Receive an Object, Return an Object (RORO) pattern.
  
  Python/FastAPI
  - Use def for pure functions and async def for asynchronous operations.
  - Use type hints for all function signatures. Prefer Pydantic models over raw dictionaries for input validation.
  - File structure: exported router, sub-routes, utilities, static content, types (models, schemas).
  - Avoid unnecessary curly braces in conditional statements.
  - For single-line statements in conditionals, omit curly braces.
  - Use concise, one-line syntax for simple conditional statements (e.g., if condition: do_something()).
  
  Error Handling and Validation
  - Prioritize error handling and edge cases:
    - Handle errors and edge cases at the beginning of functions.
    - Use early returns for error conditions to avoid deeply nested if statements.
    - Place the happy path last in the function for improved readability.
    - Avoid unnecessary else statements; use the if-return pattern instead.
    - Use guard clauses to handle preconditions and invalid states early.
    - Implement proper error logging and user-friendly error messages.
    - Use custom error types or error factories for consistent error handling.
  
  Dependencies
  - FastAPI
  - Pydantic v2
  - Async database libraries like asyncpg or aiomysql
  - SQLAlchemy 2.0 (if using ORM features)
  
  FastAPI-Specific Guidelines
  - Use functional components (plain functions) and Pydantic models for input validation and response schemas.
  - Use declarative route definitions with clear return type annotations.
  - Use def for synchronous operations and async def for asynchronous ones.
  - Minimize @app.on_event("startup") and @app.on_event("shutdown"); prefer lifespan context managers for managing startup and shutdown events.
  - Use middleware for logging, error monitoring, and performance optimization.
  - Optimize for performance using async functions for I/O-bound tasks, caching strategies, and lazy loading.
  - Use HTTPException for expected errors and model them as specific HTTP responses.
  - Use middleware for handling unexpected errors, logging, and error monitoring.
  - Use Pydantic's BaseModel for consistent input/output validation and response schemas.
  
  Performance Optimization
  - Minimize blocking I/O operations; use asynchronous operations for all database calls and external API requests.
  - Implement caching for static and frequently accessed data using tools like Redis or in-memory stores.
  - Optimize data serialization and deserialization with Pydantic.
  - Use lazy loading techniques for large datasets and substantial API responses.
  
  Key Conventions
  1. Rely on FastAPI’s dependency injection system for managing state and shared resources.
  2. Prioritize API performance metrics (response time, latency, throughput).
  3. Limit blocking operations in routes:
     - Favor asynchronous and non-blocking flows.
     - Use dedicated async functions for database and external API operations.
     - Structure routes and dependencies clearly to optimize readability and maintainability.

# Optimize (DRY, SOLID Principles)

# Optimize Code with DRY and SOLID Principles

## Communication and Problem-Solving
- **Clarify Requirements**: Always ask for clarification if the task is unclear before proceeding with implementation.
- **Contextual Awareness**: Stick to the current architecture choices (e.g., `pyproject.toml`) unless the user suggests a new method or module.

## Code Quality and Best Practices
- **DRY Principle**: Avoid code duplication by abstracting repeated logic into reusable functions or components.
- **SOLID Principles**:
  - **Single Responsibility**: Each function or class should have only one reason to change.
  - **Open/Closed**: Code should be open for extension but closed for modification.
  - **Liskov Substitution**: Subtypes should be substitutable for their base types without altering the correctness of the program.
  - **Interface Segregation**: Prefer small, specific interfaces over large, general ones.
  - **Dependency Inversion**: Depend on abstractions, not concretions.

## Paradigms and Principles
- **Functional Programming**: Use pure functions and avoid side effects where possible.
- **Object-Oriented Programming**: Encapsulate behavior and data within classes, adhering to SOLID principles.

## Semantic Naming and Abstractions
- **Descriptive Names**: Use meaningful names for variables, functions, and classes to improve readability.
- **Abstraction**: Create abstractions to hide complex logic and expose only necessary details.

## Platform Thinking
- **Consistency**: Ensure that code adheres to the platform's conventions and best practices.
- **Scalability**: Write code that can scale with the application's growth.

## Response Format
- **Code Blocks**: When outputting code blocks, include a `#` or `//` file name comment prior to the block, with a few lines before and after the modification. This helps the user identify where to make changes.

## Handling Uncertainty and Limitations
- **Ask for Clarification**: If uncertain about any part of the task, ask for more information before proceeding.
- **Document Assumptions**: Clearly document any assumptions made during implementation.

By following these guidelines, you can ensure that your code is clean, maintainable, and adheres to industry best practices.

  
Refer to FastAPI documentation for Data Models, Path Operations, and Middleware for best practices.