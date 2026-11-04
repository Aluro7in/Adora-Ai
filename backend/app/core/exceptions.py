"""
Adora AI — Custom Exception Types and Error Envelopes
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class AdoraException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "code": code,
                "message": message,
                "details": details or {},
            },
        )

class UnauthenticatedException(AdoraException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHENTICATED",
            message=message,
        )

class PermissionDeniedException(AdoraException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="PERMISSION_DENIED",
            message=message,
        )

class ApprovalRequiredException(AdoraException):
    def __init__(self, message: str = "This consequential action requires explicit human approval before execution"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="APPROVAL_REQUIRED",
            message=message,
        )

class ResourceNotFoundException(AdoraException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="RESOURCE_NOT_FOUND",
            message=message,
        )

class VerificationException(AdoraException):
    def __init__(self, message: str = "Independent verification failed to confirm expected state"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="UNVERIFIED_OUTCOME",
            message=message,
        )