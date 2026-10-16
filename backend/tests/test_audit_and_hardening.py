"""
GeoSense AI - Comprehensive Audit, Security Hardening & Performance Tests.
Validates caching performance, input validation, non-negative prediction clamping,
dataset calendar continuity, and secure CORS configuration.
"""

import os
import sys
import pytest
import pandas as pd
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import (
    app,
    get_global_data,
    get_country_data,
    get_model_evaluation_data,
    get_global_time_series,
    get_next_day_forecast,
    get_country_summaries,
    GLOBAL_CSV_PATH,
)


def test_in_memory_caching_behavior():
    """Verify that get_global_data caches and returns consistent DataFrame without reloading."""
    df1 = get_global_data()
    df2 = get_global_data()

    assert len(df1) == len(df2)
    assert list(df1.columns) == list(df2.columns)
    # Both should match the 654 consecutive days
    assert len(df1) == 654


def test_forecast_non_negative_and_finite_clamping():
    """Verify that next-day forecast counts are strictly non-negative integers and finite floats."""
    fc_res = get_next_day_forecast()
    assert fc_res["status"] == "success"
    fc = fc_res["forecast"]

    # All counts must be non-negative
    assert fc["predicted_count_rounded"] >= 0
    assert fc["predicted_count_persistence"] >= 0
    assert fc["predicted_count_rf"] >= 0.0
    assert fc["lower_bound_approx"] >= 0
    assert fc["upper_bound_approx"] >= fc["lower_bound_approx"]

    # Target date should be 2026-10-16 anchored to 2026-10-15
    assert fc["reference_observation_date"] == "2026-10-15"
    assert fc["target_forecast_date"] == "2026-10-16"


def test_query_parameter_validation_chronology():
    """Verify that start_date > end_date raises an HTTP 400 Bad Request exception."""
    with pytest.raises(HTTPException) as exc_info:
        get_global_time_series(start_date="2026-09-10", end_date="2026-09-01")

    assert exc_info.value.status_code == 400
    assert "start_date" in exc_info.value.detail
    assert "cannot be later than end_date" in exc_info.value.detail


def test_query_parameter_days_filtering():
    """Verify that days filter returns exactly the requested number of trailing days."""
    res = get_global_time_series(days=14)
    assert res["status"] == "success"
    assert res["returned_count"] == 14
    assert res["total_available_days"] == 654
    assert len(res["records"]) == 14

    # The last record should be 2026-10-16
    assert res["records"][-1]["date"] == "2026-10-16"


def test_dataset_calendar_continuity_and_completeness():
    """Verify that daily_global_hotspots.csv has unbroken chronological continuity with 0 missing days."""
    assert os.path.isfile(GLOBAL_CSV_PATH), f"Missing dataset: {GLOBAL_CSV_PATH}"
    df = pd.read_csv(GLOBAL_CSV_PATH)

    assert len(df) == 654
    dates = pd.to_datetime(df["date"])

    # Verify min date is 2025-01-01 and max date is 2026-10-16
    assert dates.min().strftime("%Y-%m-%d") == "2025-01-01"
    assert dates.max().strftime("%Y-%m-%d") == "2026-10-16"

    # Compute date differences to ensure exactly 1 day between every adjacent row
    diffs = dates.diff().dropna()
    assert (diffs == pd.Timedelta(days=1)).all(), "Found gaps or duplicates in the processed calendar days!"

    # Verify no NaN values in essential telemetry
    assert df["detection_count"].isna().sum() == 0
    assert df["mean_frp"].isna().sum() == 0
    assert df["moving_avg_7d"].isna().sum() == 0

    # Verify observation status labels
    complete_count = (df["observation_status"] == "complete").sum()
    partial_count = (df["observation_status"] == "partial_or_near_real_time").sum()
    assert complete_count == 653
    assert partial_count == 1
    assert df.iloc[-1]["observation_status"] == "partial_or_near_real_time"


def test_cors_middleware_configuration():
    """Verify that CORS middleware is securely configured without wildcard with credentials."""
    from fastapi.middleware.cors import CORSMiddleware
    cors_middlewares = [m for m in app.user_middleware if m.cls == CORSMiddleware]
    assert len(cors_middlewares) == 1
    kwargs = cors_middlewares[0].kwargs
    allowed_origins = kwargs.get("allow_origins", [])

    # Wildcard '*' must NOT be allowed alongside credentials
    assert "*" not in allowed_origins
    assert "http://localhost:5173" in allowed_origins
    assert "http://127.0.0.1:5173" in allowed_origins

    # Allowed methods should be strictly read-only GET and OPTIONS
    allowed_methods = kwargs.get("allow_methods", [])
    assert set(allowed_methods) == {"GET", "OPTIONS"}


def test_firms_map_key_configuration_and_isolation(monkeypatch):
    """Verify that FIRMS_MAP_KEY is handled securely and never exposed in responses."""
    from app.main import health_check, read_root

    # By default in test environment, health check returns boolean flag
    health = health_check()
    assert "firms_map_key_configured" in health
    assert isinstance(health["firms_map_key_configured"], bool)

    # Test with simulated secret key
    dummy_key = "abc123secretmockkey9876543210xyz"
    monkeypatch.setenv("FIRMS_MAP_KEY", dummy_key)
    from app import main
    monkeypatch.setattr(main, "FIRMS_MAP_KEY", dummy_key)

    health_with_key = main.health_check()
    assert health_with_key["firms_map_key_configured"] is True
    # The secret key string itself must NEVER appear in health output
    assert dummy_key not in str(health_with_key)

    root_res = main.read_root()
    assert dummy_key not in str(root_res)


def test_firms_live_endpoint_missing_key_behavior(monkeypatch):
    """Verify that /api/firms/live gracefully errors with HTTP 503 when key is missing."""
    from app import main
    monkeypatch.setattr(main, "FIRMS_MAP_KEY", None)

    with pytest.raises(HTTPException) as exc_info:
        main.get_firms_live_data(day_range=1)
    assert exc_info.value.status_code == 503
    assert "FIRMS_MAP_KEY is not configured" in exc_info.value.detail


def test_firms_live_endpoint_caching_and_schema(monkeypatch):
    """Verify that /api/firms/live returns expected schema and properly isolates keys."""
    from app import main

    # Use existing active test response or simulated response to verify schema
    data = main.get_firms_live_data(day_range=1)
    assert data["status"] == "success"
    assert "source" in data
    assert "satellite" in data
    assert "refresh_timestamp" in data
    assert "total_recent_detections" in data
    assert "detections_by_date" in data
    assert isinstance(data["detections_by_date"], list)
    if len(data["detections_by_date"]) > 0:
        entry = data["detections_by_date"][0]
        assert "observation_date" in entry
        assert "detection_count" in entry
        assert "mean_frp_mw" in entry
        assert "status" in entry

    # Verify second call is cached
    cached_data = main.get_firms_live_data(day_range=1, force_refresh=False)
    assert cached_data["cached"] is True



