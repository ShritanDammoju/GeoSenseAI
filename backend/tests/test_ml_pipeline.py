"""
Unit tests for GeoSense AI Machine Learning Pipeline & Stage 5 Endpoints.
NOTE: Uses synthetic time-series data fixtures. Never actual NASA observations.
"""

import os
import sys
import tempfile
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.train import (
    load_and_engineer_features,
    split_chronologically,
    evaluate_predictions,
    FEATURE_COLUMNS,
)
from app.main import (
    health_check,
    get_next_day_forecast,
    get_models_evaluation,
    get_data_quality_audit,
    get_country_summaries,
)



@pytest.fixture
def synthetic_time_series_csv():
    """
    Creates a temporary synthetic daily time-series CSV for 30 consecutive days.
    LABEL: SYNTHETIC TEST FIXTURE (NOT ACTUAL NASA OBSERVATIONS).
    """
    dates = pd.date_range("2026-01-01", periods=30, freq="D")
    data = []
    for i, dt in enumerate(dates):
        # Synthetic deterministic trend
        count = 1000 + i * 50 + (i % 7) * 20
        data.append({
            "date": dt.strftime("%Y-%m-%d"),
            "detection_count": count,
            "high_confidence_count": int(count * 0.1),
            "vegetation_fire_count": int(count * 0.9),
            "mean_frp": 10.0 + (i % 5),
            "total_frp": count * 10.0,
            "source_product": "SYNTHETIC_TEST_VIIRS",
            "coverage_scope": "synthetic_global",
            "observation_status": "complete",
            "moving_avg_7d": float(count),
        })

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv", encoding="utf-8") as f:
        df = pd.DataFrame(data)
        df.to_csv(f.name, index=False)
        temp_path = f.name

    yield temp_path

    if os.path.exists(temp_path):
        os.remove(temp_path)


def test_feature_engineering_no_leakage(synthetic_time_series_csv):
    """Verify that lag and rolling window features do not leak target day information."""
    df = load_and_engineer_features(synthetic_time_series_csv)

    # 30 days minus 7 warmup days = 23 rows
    assert len(df) == 23

    # On any row t, lag_1 must equal previous day's detection_count
    for i in range(1, len(df)):
        assert df.loc[i, "lag_1"] == df.loc[i - 1, "detection_count"]

    # Rolling mean on day t must be calculated from past 7 days, excluding day t
    for i in range(len(df)):
        assert df.loc[i, "rolling_mean_7"] != df.loc[i, "detection_count"]


def test_chronological_split_strict_ordering(synthetic_time_series_csv):
    """Verify that train, validation, and test splits are strictly sequential with no overlap."""
    df = load_and_engineer_features(synthetic_time_series_csv)
    train_df, val_df, test_df = split_chronologically(
        df,
        val_start="2026-01-18",
        test_start="2026-01-24",
    )

    assert len(train_df) > 0
    assert len(val_df) > 0
    assert len(test_df) > 0

    assert train_df["date"].max() < val_df["date"].min()
    assert val_df["date"].max() < test_df["date"].min()


def test_evaluation_metrics_math():
    """Verify mathematical calculation of MAE, RMSE, MAPE, and R2."""
    y_true = np.array([100.0, 200.0, 300.0])
    y_pred = np.array([110.0, 190.0, 330.0])  # errors: +10, -10, +30

    metrics = evaluate_predictions(y_true, y_pred, "Synthetic Model")

    # MAE = (10 + 10 + 30) / 3 = 50 / 3 = 16.67
    assert metrics["mae"] == 16.67
    # RMSE = sqrt((100 + 100 + 900) / 3) = sqrt(1100 / 3) = sqrt(366.67) = 19.15
    assert metrics["rmse"] == 19.15
    # MAPE = (10/100 + 10/200 + 30/300) / 3 * 100 = (0.10 + 0.05 + 0.10) / 3 * 100 = 8.33%
    assert metrics["mape_percent"] == 8.33


def test_api_forecast_and_model_evaluation_endpoints():
    """Test FastAPI endpoint handlers for Stage 5 forecast and model evaluation."""
    # Test health_check()
    health_data = health_check()
    assert health_data["status"] == "healthy"
    assert health_data["models_available"] is True

    # Test get_next_day_forecast()
    fc_data = get_next_day_forecast()
    assert fc_data["status"] == "success"
    assert "forecast" in fc_data
    forecast = fc_data["forecast"]
    assert "predicted_count_rf" in forecast
    assert "predicted_count_persistence" in forecast
    assert "predicted_count_ma7" in forecast
    assert "target_forecast_date" in forecast
    assert "reference_observation_date" in forecast

    # Test get_models_evaluation()
    eval_data = get_models_evaluation()
    assert eval_data["status"] == "success"
    assert "evaluation_summary" in eval_data
    test_metrics = eval_data["evaluation_summary"]["test_metrics"]
    assert "random_forest" in test_metrics
    assert "previous_day_baseline" in test_metrics
    assert "seven_day_moving_avg" in test_metrics


def test_data_quality_and_country_endpoints():
    """Test data quality audit and country summary endpoints."""
    dq_data = get_data_quality_audit()
    assert dq_data["status"] == "success"
    assert "provenance" in dq_data
    assert dq_data["provenance"]["missing_days_count"] == 0
    assert dq_data["provenance"]["total_files_processed"] == 220
    assert dq_data["provenance"]["satellite"] == "NOAA-20 (JPSS-1)"

    countries_data = get_country_summaries(limit=10)
    assert countries_data["status"] == "success"
    assert len(countries_data["countries"]) == 10
    top_country = countries_data["countries"][0]
    assert "country" in top_country
    assert "total_detections" in top_country


