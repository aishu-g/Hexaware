from typing import List, Optional
import numpy as np
from app.schemas import AggregateMetricPayload, AggregateAnomalyResult

class AggregateAnomalyDetector:
    def analyze_aggregates(
        self,
        current: List[AggregateMetricPayload],
        baseline: Optional[List[AggregateMetricPayload]] = None
    ) -> List[AggregateAnomalyResult]:
        if not current:
            return []

        results: List[AggregateAnomalyResult] = []

        # Map baseline by (state, district) if available
        baseline_map = {}
        if baseline:
            for b in baseline:
                baseline_map[(b.state, b.district)] = b

        ur_list = [m.unemployment_rate for m in current]
        ur_mean, ur_std = np.mean(ur_list), max(np.std(ur_list), 0.5)

        lfpr_list = [m.labor_force_participation for m in current]
        lfpr_mean, lfpr_std = np.mean(lfpr_list), max(np.std(lfpr_list), 0.5)

        for curr in current:
            reasons = []
            score = 0.0
            key = (curr.state, curr.district)
            base = baseline_map.get(key)

            if base:
                # Compare against historical quarter baseline
                ur_diff = curr.unemployment_rate - base.unemployment_rate
                if abs(ur_diff) > 5.0:
                    reasons.append(f"Unemployment rate shifted {ur_diff:+.1f}% vs baseline quarter ({curr.unemployment_rate:.1f}% vs {base.unemployment_rate:.1f}%)")
                    score += 0.40

                lfpr_diff = curr.labor_force_participation - base.labor_force_participation
                if abs(lfpr_diff) > 6.0:
                    reasons.append(f"LFPR shifted {lfpr_diff:+.1f}% vs baseline quarter ({curr.labor_force_participation:.1f}% vs {base.labor_force_participation:.1f}%)")
                    score += 0.35
            else:
                # Compare against current cross-district distribution
                z_ur = (curr.unemployment_rate - ur_mean) / ur_std
                if abs(z_ur) > 2.5:
                    reasons.append(f"District Unemployment Rate ({curr.unemployment_rate:.1f}%) deviates significantly from state average (z={z_ur:.1f})")
                    score += 0.45

                z_lfpr = (curr.labor_force_participation - lfpr_mean) / lfpr_std
                if abs(z_lfpr) > 2.5:
                    reasons.append(f"District LFPR ({curr.labor_force_participation:.1f}%) deviates significantly from state average (z={z_lfpr:.1f})")
                    score += 0.45

            is_anomaly = score >= 0.35 or len(reasons) > 0

            results.append(AggregateAnomalyResult(
                state=curr.state,
                district=curr.district,
                is_anomaly=is_anomaly,
                deviation_score=round(min(score, 1.0), 3),
                reasons=reasons if reasons else ["Aggregate metrics within expected variance"]
            ))

        return results
