import numpy as np
import pandas as pd
from typing import List, Tuple
from sklearn.ensemble import IsolationForest
from app.schemas import RecordPayload, AnomalyScoreResult

class RecordAnomalyDetector:
    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )

    def analyze_batch(self, records: List[RecordPayload]) -> List[AnomalyScoreResult]:
        if not records:
            return []

        # Convert records to DataFrame for feature extraction
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "household_id": r.household_id,
                "age": r.age,
                "sex": r.sex,
                "education": r.education,
                "activity_status": r.activity_status,
                "weekly_earnings": r.weekly_earnings,
                "hours_worked": r.hours_worked,
                "response_time": r.response_time_seconds
            })
        df = pd.DataFrame(data)

        # Feature matrix for Isolation Forest
        feature_cols = ["age", "education", "activity_status", "weekly_earnings", "hours_worked", "response_time"]
        X = df[feature_cols].fillna(0).values

        # Fit & Predict Isolation Forest if sufficient samples, else fallback to z-score heuristics
        if len(records) >= 5:
            self.model.fit(X)
            raw_scores = self.model.score_samples(X)  # lower = more anomalous
            # Normalize scores to [0.0, 1.0] where 1.0 is highest anomaly
            min_s, max_s = raw_scores.min(), raw_scores.max()
            if max_s - min_s > 1e-6:
                norm_scores = 1.0 - (raw_scores - min_s) / (max_s - min_s)
            else:
                norm_scores = np.zeros(len(records))
            predictions = self.model.predict(X)  # -1 for anomaly, 1 for normal
        else:
            norm_scores = np.zeros(len(records))
            predictions = np.ones(len(records))

        # Calculate IQR and Z-scores per column for explainable reasons
        results: List[AnomalyScoreResult] = []
        earnings_q1, earnings_q3 = df["weekly_earnings"].quantile(0.25), df["weekly_earnings"].quantile(0.75)
        earnings_iqr = max(earnings_q3 - earnings_q1, 1.0)

        hours_mean, hours_std = df["hours_worked"].mean(), max(df["hours_worked"].std(), 1.0)
        speed_q1 = df["response_time"].quantile(0.10) if len(df) >= 5 else 60.0

        for idx, row in df.iterrows():
            reasons = []
            score = float(norm_scores[idx])
            is_iforest_anomaly = (predictions[idx] == -1)

            # Heuristic / Statistical flag checks
            age = int(row["age"])
            activity = int(row["activity_status"])
            earnings = float(row["weekly_earnings"])
            hours = float(row["hours_worked"])
            resp_time = float(row["response_time"])

            # 1. Age-Activity / Earnings check
            if age < 15 and activity in [11, 21, 31, 41, 51]:
                reasons.append(f"Minor child (age {age}) marked as employed with activity status {activity}")
                score = max(score, 0.85)

            if age < 15 and earnings > 0:
                reasons.append(f"Child (age {age}) reporting positive earnings ({earnings} INR)")
                score = max(score, 0.80)

            # 2. Extreme Weekly Earnings IQR check
            if earnings > (earnings_q3 + 3.0 * earnings_iqr) and earnings > 50000:
                reasons.append(f"Weekly earnings ({earnings:,.0f} INR) exceeds 3x IQR upper bound")
                score = max(score, 0.75)

            # 3. Hours worked z-score check
            z_hours = (hours - hours_mean) / hours_std
            if hours > 98 or z_hours > 3.2:
                reasons.append(f"Excessive weekly hours worked ({hours:.0f} hrs, z={z_hours:.1f})")
                score = max(score, 0.70)

            # 4. Rapid completion speed check
            if resp_time > 0 and resp_time < 90:
                reasons.append(f"Unusually fast response completion ({resp_time:.0f} sec)")
                score = max(score, 0.65)

            if is_iforest_anomaly and not reasons:
                reasons.append("Multivariate statistical outlier detected by Isolation Forest")

            is_anomaly = score >= 0.50 or len(reasons) > 0

            results.append(AnomalyScoreResult(
                id=str(row["id"]),
                household_id=str(row["household_id"]),
                is_anomaly=is_anomaly,
                anomaly_score=round(float(score), 3),
                confidence=0.88 if is_anomaly else 0.95,
                reasons=reasons if reasons else ["No statistical anomaly detected"],
                metrics={
                    "isolation_forest_score": round(float(norm_scores[idx]), 3),
                    "weekly_earnings": earnings,
                    "hours_worked": hours,
                    "response_time": resp_time
                }
            ))

        return results
