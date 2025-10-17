from fastapi.security import  HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Request
from typing import Optional
import jwt
from app.config import settings

def decodeJWT(jwtoken: str):
        """
        Decode JWT token.

        Args:
            jwtoken: JWT token string

        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(jwtoken, settings.secret_key, settings.algorithm)
            return payload
        except jwt.InvalidTokenError:
            return None

class JWTBearer(HTTPBearer):
    """
    JWT Bearer token authentication class.
    
    Follows the Medium article pattern for JWT authentication.
    """
    
    def __init__(self, auto_error: bool = False):
        super(JWTBearer, self).__init__(auto_error=auto_error)


    async def __call__(self, request: Request) -> Optional[str]:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        
        if not auth:
            raise HTTPException(status_code=422, detail="Missing required header: Authorization")
        
        try:
            scheme, token = auth.split(None, 1)
            credentials = HTTPAuthorizationCredentials(scheme=scheme, credentials=token)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid authorization header format.")
        
        if not credentials.scheme == "Bearer":
            raise HTTPException(status_code=422, detail="Invalid authentication scheme.")
        token = credentials.credentials
        if not self.verify_jwt(token):
            raise HTTPException(status_code=401, detail="Invalid token or expired token.")
        return token
    
    def verify_jwt(self, jwtoken: str) -> bool:
        try:
            payload = decodeJWT(jwtoken)
            return payload is not None
        except jwt.ExpiredSignatureError:
            return False
        except jwt.PyJWTError:
            return False


# JWT Bearer instance
jwt_bearer = JWTBearer()