from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    BatchRecordRequest,
    BatchRecordResponse,
    ClusterAnalysisRequest,
    ClusterAnalysisResponse,
    AggregateAnalysisRequest,
    AggregateAnalysisResponse,
    ScoreResponse,
    ScoreItem
)
from app.models.anomaly_detector import RecordAnomalyDetector
from app.models.cluster_analysis import ClusterAnomalyDetector
from app.models.aggregate_checks import AggregateAnomalyDetector

router = APIRouter(tags=["SurvIntel ML Validation Engine"])

record_detector = RecordAnomalyDetector()
cluster_detector = ClusterAnomalyDetector()
aggregate_detector = AggregateAnomalyDetector()

@router.get("/health")
@router.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SurvIntel Python ML Microservice",
        "version": "1.0.0",
        "endpoints": ["/score/record", "/score/cluster", "/score/aggregate"],
        "models_loaded": ["IsolationForest", "ZScore_IQR", "ClusterDivergence", "TimeSeriesBaseline"]
    }

# 1. Record-level scoring endpoint: Z-Score & IQR outlier detection per numeric field vs historical distribution
@router.post("/score/record", response_model=ScoreResponse)
@router.post("/api/v1/analyze/record", response_model=BatchRecordResponse)
def analyze_records(payload: BatchRecordRequest):
    try:
        results = record_detector.analyze_batch(payload.records)
        scores = []
        for r in results:
            explanation = "; ".join(r.reasons) if r.reasons else "Within normal statistical baseline range"
            scores.append(ScoreItem(
                entity_type="record",
                entity_id=r.id,
                score=r.anomaly_score,
                method="ZScore_IQR_IsolationForest",
                explanation=explanation,
                batch_id=payload.batch_id
            ))
        return ScoreResponse(
            batch_id=payload.batch_id,
            entity_type="record",
            total_processed=len(payload.records),
            scores=scores
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Record anomaly analysis failed: {str(e)}"
        )

# 2. Cluster-level scoring endpoint: Per-enumerator / PSU deviation vs peer group (Isolation Forest on response-time & pattern features)
@router.post("/score/cluster", response_model=ScoreResponse)
@router.post("/api/v1/analyze/cluster", response_model=ClusterAnalysisResponse)
def analyze_clusters(payload: ClusterAnalysisRequest):
    try:
        results = cluster_detector.analyze_enumerators(payload.enumerator_records)
        scores = []
        for r in results:
            explanation = "; ".join(r.deviation_reasons) if r.deviation_reasons else "Normal peer cluster benchmark"
            scores.append(ScoreItem(
                entity_type="cluster",
                entity_id=r.enumerator_id,
                score=r.risk_score,
                method="IsolationForest_ClusterDivergence",
                explanation=explanation,
                batch_id=payload.batch_id
            ))
        return ScoreResponse(
            batch_id=payload.batch_id,
            entity_type="cluster",
            total_processed=len(payload.enumerator_records),
            scores=scores
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cluster analysis failed: {str(e)}"
        )

# 3. Aggregate-level scoring endpoint: Time-series deviation vs historical trend (seasonal baseline + threshold)
@router.post("/score/aggregate", response_model=ScoreResponse)
@router.post("/api/v1/analyze/aggregate", response_model=AggregateAnalysisResponse)
def analyze_aggregates(payload: AggregateAnalysisRequest):
    try:
        results = aggregate_detector.analyze_aggregates(
            payload.current_metrics,
            payload.baseline_metrics
        )
        scores = []
        for r in results:
            explanation = "; ".join(r.reasons) if r.reasons else "Within historical seasonal baseline threshold"
            scores.append(ScoreItem(
                entity_type="aggregate",
                entity_id=f"{r.state}_{r.district}",
                score=r.deviation_score,
                method="TimeSeriesBaseline_SeasonalThreshold",
                explanation=explanation,
                batch_id="aggregate_batch"
            ))
        return ScoreResponse(
            batch_id="aggregate_batch",
            entity_type="aggregate",
            total_processed=len(payload.current_metrics),
            scores=scores
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Aggregate analysis failed: {str(e)}"
        )
