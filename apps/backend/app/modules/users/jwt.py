from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Request
from typing import Optional
import jwt

class JWTBearer(HTTPBearer):
    """
    JWT Bearer token authentication class.
    
    Follows the Medium article pattern for JWT authentication.
    """
    
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)


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

    
    async def __call__(self, request: Request) -> Optional[str]:
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            token = credentials.credentials
            if not self.verify_jwt(token):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            return token
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")
    
    def verify_jwt(self, jwtoken: str) -> bool:
        try:
            payload = decodeJWT(jwtoken)
            return payload is not None
        except jwt.ExpiredSignatureError:
            return False
        except jwt.JWTError:
            return False


# JWT Bearer instance
jwt_bearer = JWTBearer()