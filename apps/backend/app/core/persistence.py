"""
Persistence layer - handles data storage operations.

This module provides:
- PersistenceProtocol: Interface that all persistence implementations must follow
- JSONPersistence: JSON file-based implementation

Following SOLID principles:
- DIP: Code depends on PersistenceProtocol (abstraction), not concrete implementation
- OCP: Can add new persistence types (PostgreSQL, MongoDB) without modifying existing code
- SRP: Only handles data persistence operations
"""

import json
import os
from typing import Protocol, Any
from pathlib import Path
import json


class PersistenceProtocol(Protocol):
    """
    Protocol (interface) for persistence layer.
    
    Defines contract for data persistence operations.
    Any class implementing these methods can be used as persistence layer.
    """
    
    @classmethod
    def create_instance(cls, file_path: str, collection: str) -> "PersistenceProtocol":
        """
        Factory method to create persistence instance.
        
        Args:
            file_path: Path to database file
            collection: Collection/table name
        
        Returns:
            Persistence instance
        """
        ...
    
    def create(self, id: str, data: dict) -> dict:
        """Create a new item."""
        ...
    
    def get(self, id: str) -> dict | None:
        """Get item by ID."""
        ...
    
    def get_all(self) -> list[dict]:
        """Get all items."""
        ...
    
    def update(self, id: str, data: dict) -> dict | None:
        """Update an item."""
        ...
    
    def delete(self, id: str) -> bool:
        """Delete an item."""
        ...
    
    def find_by_field(self, field: str, value: Any) -> dict | None:
        """Find first item where field equals value."""
        ...


class JSONPersistence(PersistenceProtocol):
    """
    JSON file-based persistence implementation with collections.
    
    Implements PersistenceProtocol for type safety and interface compliance.
    
    Stores data in a JSON file with collections (like MongoDB):
    {
        "users": {
            "user_id_1": {"id": "user_id_1", "username": "john", ...},
            "user_id_2": {"id": "user_id_2", "username": "jane", ...}
        },
        "tasks": {
            "task_id_1": {"id": "task_id_1", "title": "Task 1", ...}
        }
    }
    
    Each collection is isolated - perfect for multi-module apps.
    Thread-safe for single process (reads/writes entire file).
    """
    
    @classmethod
    def create_instance(cls, file_path: str, collection: str) -> "JSONPersistence":
        """
        Factory method to create JSONPersistence instance.
        
        Args:
            file_path: Path to JSON file (shared across collections)
            collection: Collection name (e.g., "users", "tasks")
        
        Returns:
            JSONPersistence instance
        """
        return cls(file_path, collection)
    
    def __init__(self, file_path: str, collection: str):
        """
        Initialize JSON persistence for a specific collection.
        
        Args:
            file_path: Path to JSON file (shared across collections)
            collection: Collection name (e.g., "users", "tasks")
        """
        self.file_path = Path(file_path)
        self.collection = collection
        self._ensure_file_exists()
    
    def _ensure_file_exists(self) -> None:
        """Create file and parent directories if they don't exist."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self._write({})
    
    def _read(self) -> dict[str, dict]:
        """Read all collections from JSON file."""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    
    def _write(self, data: dict[str, dict]) -> None:
        """Write all collections to JSON file."""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _get_collection(self) -> dict[str, dict]:
        """Get this instance's collection from the file."""
        all_data = self._read()
        return all_data.get(self.collection, {})
    
    def _save_collection(self, collection_data: dict[str, dict]) -> None:
        """Save this instance's collection to the file."""
        all_data = self._read()
        all_data[self.collection] = collection_data
        self._write(all_data)
    
    def create(self, id: str, data: dict) -> dict:
        """
        Create a new item in this collection.
        
        Args:
            id: Unique identifier for the item
            data: Item data (must include 'id' field)
        
        Returns:
            Created item data
        
        Raises:
            ValueError: If item with this ID already exists in this collection
        """
        items = self._get_collection()
        
        if id in items:
            raise ValueError(f"Item with ID '{id}' already exists in collection '{self.collection}'")
        
        items[id] = data
        self._save_collection(items)
        return data
    
    def get(self, id: str) -> dict | None:
        """
        Get item by ID from this collection.
        
        Args:
            id: Item identifier
        
        Returns:
            Item data or None if not found
        """
        items = self._get_collection()
        return items.get(id)
    
    def get_all(self) -> list[dict]:
        """
        Get all items from this collection.
        
        Returns:
            List of all items in this collection
        """
        items = self._get_collection()
        return list(items.values())
    
    def update(self, id: str, data: dict) -> dict | None:
        """
        Update an existing item in this collection.
        
        Args:
            id: Item identifier
            data: Updated item data
        
        Returns:
            Updated item data or None if not found
        """
        items = self._get_collection()
        
        if id not in items:
            return None
        
        items[id] = data
        self._save_collection(items)
        return data
    
    def delete(self, id: str) -> bool:
        """
        Delete an item from this collection.
        
        Args:
            id: Item identifier
        
        Returns:
            True if deleted, False if not found
        """
        items = self._get_collection()
        
        if id not in items:
            return False
        
        del items[id]
        self._save_collection(items)
        return True
    
    def find_by_field(self, field: str, value: Any) -> dict | None:
        """
        Find first item in this collection where field equals value.
        
        Args:
            field: Field name to search
            value: Value to match
        
        Returns:
            First matching item or None
        """
        items = self._get_collection()
        for item in items.values():
            if item.get(field) == value:
                return item
        return None
