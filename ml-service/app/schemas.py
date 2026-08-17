from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RecordPayload(BaseModel):
    id: str
    household_id: str
    age: int
    sex: int
    education: int
    activity_status: int
    weekly_earnings: float = 0.0
    hours_worked: float = 0.0
    response_time_seconds: float = 0.0
    extra_features: Optional[Dict[str, Any]] = None

class BatchRecordRequest(BaseModel):
    batch_id: str
    records: List[RecordPayload]

class AnomalyScoreResult(BaseModel):
    id: str
    household_id: str
    is_anomaly: bool
    anomaly_score: float  # Normalized 0.0 to 1.0 (higher = more anomalous)
    confidence: float
    reasons: List[str]
    metrics: Dict[str, float]

class BatchRecordResponse(BaseModel):
    batch_id: str
    total_processed: int
    anomaly_count: int
    results: List[AnomalyScoreResult]

class EnumeratorRecordPayload(BaseModel):
    enumerator_id: str
    psu_id: str
    household_count: int
    avg_response_time: float
    hours_worked_avg: float
    zero_earnings_pct: float
    anomaly_rate: float

class ClusterAnalysisRequest(BaseModel):
    batch_id: str
    enumerator_records: List[EnumeratorRecordPayload]

class EnumeratorRiskResult(BaseModel):
    enumerator_id: str
    psu_id: str
    risk_score: float  # 0.0 to 1.0
    is_outlier: bool
    deviation_reasons: List[str]

class ClusterAnalysisResponse(BaseModel):
    batch_id: str
    high_risk_count: int
    results: List[EnumeratorRiskResult]

class AggregateMetricPayload(BaseModel):
    state: str
    district: str
    quarter: str
    unemployment_rate: float
    labor_force_participation: float
    avg_weekly_earnings: float
    total_surveyed: int

class AggregateAnalysisRequest(BaseModel):
    current_metrics: List[AggregateMetricPayload]
    baseline_metrics: Optional[List[AggregateMetricPayload]] = None

class AggregateAnomalyResult(BaseModel):
    state: str
    district: str
    is_anomaly: bool
    deviation_score: float
    reasons: List[str]

class AggregateAnalysisResponse(BaseModel):
    anomaly_count: int
    results: List[AggregateAnomalyResult]

class ScoreItem(BaseModel):
    entity_type: str  # 'record' | 'cluster' | 'aggregate'
    entity_id: str
    score: float
    method: str
    explanation: str
    batch_id: Optional[str] = None

class ScoreResponse(BaseModel):
    batch_id: Optional[str] = None
    entity_type: str
    total_processed: int
    scores: List[ScoreItem]
