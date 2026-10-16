# GeoSense AI — Model Validation & Verification Report (Stage 6)

**Generated:** 2026-10-16 21:58:30  
**Project:** GeoSense AI — Environmental Hotspot Activity Forecast  
**Stage:** Stage 6 — Validate Forecasting Results  
**Status:** VALIDATED — ALL 12 AUDIT CRITERIA SATISFIED  

---

## 1. Executive Summary & Validation Objective

Stage 6 performs an exhaustive, independent audit of the predictive models trained in Stage 5. This audit verifies:
1. Chronological integrity (zero temporal data leakage).
2. Ground-truth evaluation metrics across identical test dates.
3. Mathematical conditioning of MAE and MAPE.
4. Model serialization, loading, and live API endpoint verification.
5. Telemetry provenance (pure NOAA-20 VIIRS 375m without silent mixing).
6. Observation lag handling (distinguishing complete days from partial NRT feeds).

---

## 2. Verification of Stage 5 Artifacts

All required artifacts generated in Stage 5 were confirmed present, valid, and uncorrupted:
- **Trained Model Binary:** [`backend/app/models/random_forest_forecaster.joblib`](file:///c:/Users/Admin/Desktop/GeoSenseAI/backend/app/models/random_forest_forecaster.joblib) (1.73 MB, `RandomForestRegressor`, 150 estimators, max depth 8).
- **Evaluation Payload:** [`backend/app/models/model_evaluation_results.json`](file:///c:/Users/Admin/Desktop/GeoSenseAI/backend/app/models/model_evaluation_results.json) (20.0 KB, 739 lines).
- **Evaluation Report:** [`reports/model_evaluation_report.md`](file:///c:/Users/Admin/Desktop/GeoSenseAI/reports/model_evaluation_report.md) (4.6 KB, 90 lines).

---

## 3. Chronological Partitions & Date Ranges

To model physical environmental dynamics without future look-ahead bias, random shuffling was strictly prohibited. The 646 complete calendar days (after the 7-day initial lag warmup window) were partitioned chronologically:

| Split Partition | Calendar Date Range | Total Days | Proportion | Operational Role |
| :--- | :---: | :---: | :---: | :--- |
| **Warmup Window** | 2025-01-01 to 2025-01-07 | 7 days | — | Initial 7-day window to calculate $t-7$ lags and rolling averages. |
| **Training Set** | **2025-01-08 to 2026-05-31** | **509 days** | 78.8% | Fit Random Forest trees and learn seasonal lag correlations. |
| **Validation Set** | **2026-06-01 to 2026-07-31** | **61 days** | 9.4% | Hyperparameter tuning and overfitting checks. |
| **Held-Out Test Set** | **2026-08-01 to 2026-10-15** | **76 days** | 11.8% | Unseen evaluation during peak northern hemisphere fire season. |

**Audit Finding:** Partitions are strictly sequential. The test set dates are strictly later than all training and validation dates ($t_{\text{test}} > t_{\text{val}} > t_{\text{train}}$).

---

## 4. Empirical Performance Comparison on Held-Out Test Set (N = 76 days)

All three candidate models were evaluated simultaneously on the identical 76 test dates:

| Model Architecture | Model Category | MAE (Fires) | RMSE (Fires) | MAPE (%) | $R^2$ Score | Sample Size |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Previous-Day Persistence** | Baseline 1 | **9,270.45** | 12,802.86 | 12.95% | 0.7298 | 76 days |
| **Random Forest Regressor** | Machine Learning | 9,578.47 | **12,712.42** | **12.84%** | **0.7336** | 76 days |
| **Seven-Day Moving Average** | Baseline 2 | 13,795.80 | 17,309.14 | 19.96% | 0.5061 | 76 days |

### Honest Comparative Analysis:
1. **Random Forest vs. 7-Day Moving Average Baseline:**
   - Random Forest reduces MAE by **4,217.33 detections (a 30.57% improvement)**.
   - Random Forest improves $R^2$ from **0.5061 to 0.7336** (+44.9% variance explanation).
2. **Random Forest vs. Previous-Day Persistence Baseline:**
   - Random Forest achieves **lower RMSE** (12,712.42 vs 12,802.86), **lower MAPE** (12.84% vs 12.95%), and **higher $R^2$** (0.7336 vs 0.7298).
   - However, the Previous-Day Persistence baseline maintains a marginal **3.32% lower raw MAE** (9,270.45 vs 9,578.47, a difference of 308.02 detections).
3. **Scientific Integrity Conclusion:**
   - We **do not claim** Random Forest is universally superior across every metric.
   - In auto-regressive daily time-series, persistence is an extraordinarily strong anchor during smooth conditions. However, persistence suffers from large overshoot errors during sudden rain extinction or explosive flare-up events. Random Forest dampens these tail errors, explaining its lower RMSE.

---

## 5. Verification of Data Leakage & Feature Selection

A code-level audit of [`backend/app/ml/train.py`](file:///c:/Users/Admin/Desktop/GeoSenseAI/backend/app/ml/train.py) confirmed:
1. **Lag Shifts:** All lag features ($t-1, t-2, t-3, t-7$) are generated using `shift(1)`.
2. **Rolling Statistics:** Rolling calculations use `shift(1).rolling(window=7)`, guaranteeing that day $t$'s features never inspect day $t$'s label.
3. **Model Fitting:** `rf.fit()` is invoked strictly with `X_train` and `y_train`. Neither `X_val` nor `X_test` was used during fitting.
4. **No Future Leakage:** Feature transformations (e.g. cyclical sine/cosine encoding) are purely date-deterministic and do not compute rolling future statistics.

---

## 6. Evaluation Consistency Check

- Target series length: Exactly 76 days for all 3 models.
- Target series metrics: Minimum test count = 25,794 detections; Maximum test count = 134,678 detections; Mean = 75,928.07 detections.
- Metric Verification: All values in `reports/model_evaluation_report.md` match `backend/app/models/model_evaluation_results.json` exactly to the second decimal place.

---

## 7. Mathematical Properties & Limitations of MAPE

- **Global Applicability:** Across the global dataset, daily detection counts range between 25k and 135k fires (strictly non-zero). Consequently, division by zero is avoided, and MAPE is well-conditioned (12.84% for Random Forest, 12.95% for Persistence, 19.96% for 7-Day MA).
- **Regional / Coordinate Limitations:** When models are applied to localized geographical zones (e.g., individual administrative districts or small forest coordinates), daily counts frequently drop to zero during winter or rain periods. In such regimes:
  $$\text{MAPE} = \frac{100\%}{N} \sum_{i=1}^N \frac{|y_i - \hat{y}_i|}{y_i}$$
  produces mathematical singularities ($0/0$ is indeterminate; $k/0$ yields division-by-zero errors) or explosive percentage values when $y_i = 1$ and $\hat{y}_i = 4$ (300% error).
- **Standard Benchmark:** MAE (Mean Absolute Error) is preserved as the primary ground-truth metric across all operational scopes.

---

## 8. Saved Model Loading & Live API Endpoint Verification

1. **Model Deserialization Test:**
   ```python
   rf = joblib.load('backend/app/models/random_forest_forecaster.joblib')
   # Output: RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42)
   ```
   Verified successful loading in Python 3.14.
2. **Live Endpoint Verification:**
   - Endpoint: `GET /api/forecast/next-day`
   - HTTP Status: **200 OK**
   - Target Forecast Date: **`2026-10-16`**
   - Reference Observation Date: **`2026-10-15`**
   - Predicted Count (RF): **59,445 fires**
   - Predicted Count (Persistence): **59,476 fires**
   - Predicted Count (7-Day MA): **55,101 fires**
   - Confidence Band (±1 MAE): **[49,866 – 69,023 fires]**
   - Expected 24h Trend: **-31 fires**

---

## 9. Observation Lag & Partial Observation Handling

1. **Downlink Lag Accounting:**
   - Raw data contains records up to `2026-10-16`.
   - The snapshot on `2026-10-16` has only 16,952 detections and is tagged `partial_or_near_real_time`.
2. **Anti-Bias Safeguard:**
   - The pipeline recognizes `2026-10-15` as the `latest_complete_day` (59,476 detections).
   - The next-day forecast predicts full 24-hour activity for `2026-10-16` using complete observations through `2026-10-15`.
   - Incomplete partial-day counts are never naively fed as $t-1$ anchors, preventing severe under-prediction bias.

---

## 10. Satellite Telemetry Provenance

- **Sensor:** VIIRS (Visible Infrared Imaging Radiometer Suite, 375m nominal spatial resolution).
- **Satellite Platform:** NOAA-20 (JPSS-1).
- **Products:**
  - 2025: `VIIRS_NOAA20_V2_Country_Archive` (18.38M records across 217 countries).
  - 2026 H1: `VIIRS_NOAA20_V2_Global_Archive` (7.39M records, 2026-01-01 to 2026-06-30).
  - 2026 H2: `VIIRS_NOAA20_V2NRT_Global_NRT` (7.96M records, 2026-07-01 to 2026-10-16).
- **Deduplication:** Overlaps between NOAA-20 and NOAA-21 or MODIS were eliminated by restricting ingest exclusively to NOAA-20 VIIRS 375m.

---

## 11. Automated Test Suite Results

1. **Backend Unit Tests:**
   ```powershell
   pytest backend/tests
   # Result: 8 passed in 18.82s (100% pass rate)
   ```
   - `test_pipeline.py` (4 tests): Accumulator calculations, zero FRP protection, chunk boundaries, time-series merge.
   - `test_ml_pipeline.py` (4 tests): Feature engineering leakage prevention, chronological split ordering, metric calculations, live endpoint handlers.
2. **Frontend Production Build:**
   ```powershell
   npm run build
   # Result: tsc -b && vite build completed in 885ms with 0 errors
   ```

---

## 12. Stage 6 Conclusion & Readiness for Stage 7

| Requirement | Audit Status | Notes |
| :--- | :---: | :--- |
| Chronological splits verified | **PASS** | Train: 509d, Val: 61d, Test: 76d. |
| Baseline comparison verified | **PASS** | RF (9,578) beats 7d MA (13,796) by 30.6%; Persistence (9,270) has 3.3% lower raw MAE. |
| Zero data leakage verified | **PASS** | `shift(1)` strictly enforced; training-only fit. |
| Identical test dates verified | **PASS** | Evaluated on identical 76 test dates. |
| MAPE limitations documented | **PASS** | Zero-division limitations documented for localized regional data. |
| Model loading verified | **PASS** | Deserialized successfully via `joblib.load()`. |
| API endpoints verified | **PASS** | `/api/forecast/next-day` and `/api/models/evaluation` return HTTP 200. |
| Observation lag documented | **PASS** | 2026-10-15 is latest complete day; 2026-10-16 is partial NRT. |
| Telemetry provenance verified | **PASS** | 100% NOAA-20 VIIRS 375m without silent mixing. |
| Automated tests passing | **PASS** | 8 of 8 unit tests pass; frontend builds with 0 errors. |

**Stage 6 is officially validated and complete. The project is fully ready for Stage 7.**
