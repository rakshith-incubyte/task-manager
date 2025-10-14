"""Core application modules."""

from app.core.config import settings, Settings
from app.core.modules import INSTALLED_MODULES, register_modules, ModuleLoader
from app.core.logger import ConsoleLogger, NullLogger, default_logger
from app.core.interfaces import LoggerProtocol, ModuleProtocol

__all__ = [
    "settings",
    "Settings",
    "INSTALLED_MODULES",
    "register_modules",
    "ModuleLoader",
    "ConsoleLogger",
    "NullLogger",
    "default_logger",
    "LoggerProtocol",
    "ModuleProtocol",
]
