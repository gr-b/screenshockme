# BAML Generated Types
from pydantic import BaseModel
from typing import Optional

class FocusAnalysisResult(BaseModel):
    negative_stimulus: bool
    analysis: str
    confidence: float
    distraction_details: Optional[str] = None
