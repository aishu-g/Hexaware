import numpy as np
import pandas as pd
from typing import List
from app.schemas import EnumeratorRecordPayload, EnumeratorRiskResult

class ClusterAnomalyDetector:
    def analyze_enumerators(self, records: List[EnumeratorRecordPayload]) -> List[EnumeratorRiskResult]:
        if not records:
            return []

        df = pd.DataFrame([r.model_dump() for r in records])

        # Benchmark peer metrics
        avg_resp_time_mean = df["avg_response_time"].mean()
        avg_resp_time_std = max(df["avg_response_time"].std(), 1.0)

        zero_earnings_mean = df["zero_earnings_pct"].mean()
        zero_earnings_std = max(df["zero_earnings_pct"].std(), 1.0)

        anomaly_rate_mean = df["anomaly_rate"].mean()
        anomaly_rate_std = max(df["anomaly_rate"].std(), 0.05)

        results: List[EnumeratorRiskResult] = []

        for _, row in df.iterrows():
            enum_id = str(row["enumerator_id"])
            psu_id = str(row["psu_id"])
            reasons = []
            risk_components = []

            # 1. Response speed anomaly check
            z_speed = (avg_resp_time_mean - row["avg_response_time"]) / avg_resp_time_std
            if z_speed > 2.0:
                reasons.append(f"Significantly faster average response time ({row['avg_response_time']:.1f}s vs peer avg {avg_resp_time_mean:.1f}s)")
                risk_components.append(0.35)

            # 2. Zero earnings / default copying check
            z_zero_earn = (row["zero_earnings_pct"] - zero_earnings_mean) / zero_earnings_std
            if z_zero_earn > 2.2 and row["zero_earnings_pct"] > 0.85:
                reasons.append(f"Abnormally high zero-earnings reporting rate ({row['zero_earnings_pct']*100:.1f}%)")
                risk_components.append(0.30)

            # 3. High individual anomaly density
            z_anomaly = (row["anomaly_rate"] - anomaly_rate_mean) / anomaly_rate_std
            if z_anomaly > 2.0:
                reasons.append(f"Elevated survey error/flag rate ({row['anomaly_rate']*100:.1f}% flagged records)")
                risk_components.append(0.35)

            total_risk = min(sum(risk_components), 1.0)
            is_outlier = total_risk >= 0.45 or len(reasons) >= 2

            results.append(EnumeratorRiskResult(
                enumerator_id=enum_id,
                psu_id=psu_id,
                risk_score=round(float(total_risk), 3),
                is_outlier=is_outlier,
                deviation_reasons=reasons if reasons else ["Enumerator performance within normal peer range"]
            ))

        return results
