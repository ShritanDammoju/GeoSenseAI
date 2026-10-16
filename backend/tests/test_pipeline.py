"""
Tests for GeoSense AI FIRMS Aggregation Pipeline.
Uses synthetic CSV fixtures for validation.
NOTE: All test fixtures below are synthetic test data, NOT actual NASA observations.
"""

import os
import sys
import tempfile
import pytest
import pandas as pd

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.pipeline.aggregator import (
    DailyAccumulator,
    process_global_csv,
    merge_and_finalize_time_series
)


@pytest.fixture
def synthetic_chunk_data():
    """
    Synthetic sample records for testing mathematical calculations.
    LABEL: SYNTHETIC TEST FIXTURE (NOT ACTUAL NASA OBSERVATIONS).
    """
    return pd.DataFrame([
        # Date 1
        {"acq_date": "2026-05-01", "latitude": 45.1, "longitude": -120.2, "confidence": "h", "frp": 10.0, "type": "0"},
        {"acq_date": "2026-05-01", "latitude": 45.2, "longitude": -120.3, "confidence": "n", "frp": 20.0, "type": "0"},
        {"acq_date": "2026-05-01", "latitude": 45.3, "longitude": -120.4, "confidence": "l", "frp": 30.0, "type": "2"},
        # Date 2
        {"acq_date": "2026-05-02", "latitude": 46.1, "longitude": -121.1, "confidence": "h", "frp": 15.0, "type": "0"},
        {"acq_date": "2026-05-02", "latitude": 46.2, "longitude": -121.2, "confidence": "h", "frp": 25.0, "type": "1"},
    ])


def test_accumulator_calculations(synthetic_chunk_data):
    """Test that detection counts, confidence counts, vegetation fires, and FRP means are computed accurately."""
    acc = DailyAccumulator()
    acc.update_from_dataframe(synthetic_chunk_data)

    df = acc.to_dataframe(source_product="SYNTHETIC_TEST", coverage_scope="TEST_SCOPE")

    assert len(df) == 2
    
    # Check 2026-05-01
    row1 = df[df["date"] == "2026-05-01"].iloc[0]
    assert row1["detection_count"] == 3
    assert row1["high_confidence_count"] == 1
    assert row1["vegetation_fire_count"] == 2  # types: '0', '0', '2'
    assert row1["total_frp"] == 60.0
    assert row1["mean_frp"] == 20.0  # (10 + 20 + 30) / 3

    # Check 2026-05-02
    row2 = df[df["date"] == "2026-05-02"].iloc[0]
    assert row2["detection_count"] == 2
    assert row2["high_confidence_count"] == 2
    assert row2["vegetation_fire_count"] == 1  # types: '0', '1'
    assert row2["total_frp"] == 40.0
    assert row2["mean_frp"] == 20.0  # (15 + 25) / 2


def test_accumulator_zero_frp_handling():
    """Verify that zero and negative FRP values do not cause division by zero in mean calculation."""
    df_zero = pd.DataFrame([
        {"acq_date": "2026-05-03", "latitude": 10.0, "longitude": 20.0, "confidence": "n", "frp": 0.0, "type": "0"},
        {"acq_date": "2026-05-03", "latitude": 10.1, "longitude": 20.1, "confidence": "n", "frp": -5.0, "type": "0"},
    ])
    acc = DailyAccumulator()
    acc.update_from_dataframe(df_zero)
    df = acc.to_dataframe(source_product="SYNTHETIC_TEST", coverage_scope="TEST_SCOPE")

    assert len(df) == 1
    row = df.iloc[0]
    assert row["detection_count"] == 2
    assert row["mean_frp"] == 0.0
    assert row["total_frp"] == 0.0


def test_chunked_csv_processing():
    """Verify process_global_csv handles chunk boundaries on synthetic files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_path = os.path.join(tmpdir, "synthetic_test_data.csv")
        # Write 10 rows
        synthetic_rows = [
            "latitude,longitude,acq_date,confidence,frp,type\n",
            "10.0,20.0,2026-06-01,h,50.0,0\n",
            "10.1,20.1,2026-06-01,n,30.0,0\n",
            "10.2,20.2,2026-06-02,h,40.0,0\n",
            "10.3,20.3,2026-06-02,l,20.0,0\n",
            "10.4,20.4,2026-06-03,h,60.0,0\n",
        ]
        with open(csv_path, "w") as f:
            f.writelines(synthetic_rows)

        # Process with tiny chunksize=2 to test boundary crossing
        df = process_global_csv(
            csv_path,
            source_product="SYNTHETIC_TEST",
            chunksize=2
        )

        assert len(df) == 3
        assert list(df["date"]) == ["2026-06-01", "2026-06-02", "2026-06-03"]
        assert df.loc[df["date"] == "2026-06-01", "detection_count"].values[0] == 2
        assert df.loc[df["date"] == "2026-06-03", "detection_count"].values[0] == 1


def test_merge_time_series_and_rolling_mean():
    """Test combining separate time series, rolling 7d mean, and observation status."""
    df1 = pd.DataFrame([
        {"date": "2026-01-01", "detection_count": 10, "high_confidence_count": 2, "vegetation_fire_count": 8, "mean_frp": 12.0, "total_frp": 120.0, "source_product": "P1", "coverage_scope": "C1"},
        {"date": "2026-01-02", "detection_count": 20, "high_confidence_count": 4, "vegetation_fire_count": 16, "mean_frp": 14.0, "total_frp": 280.0, "source_product": "P1", "coverage_scope": "C1"},
    ])
    df2 = pd.DataFrame([
        {"date": "2026-01-03", "detection_count": 30, "high_confidence_count": 6, "vegetation_fire_count": 24, "mean_frp": 16.0, "total_frp": 480.0, "source_product": "P2", "coverage_scope": "C2"},
    ])
    df3 = pd.DataFrame([
        {"date": "2026-01-04", "detection_count": 40, "high_confidence_count": 8, "vegetation_fire_count": None, "mean_frp": 18.0, "total_frp": 720.0, "source_product": "P3", "coverage_scope": "C2"},
    ])

    merged = merge_and_finalize_time_series(df1, df2, df3, latest_date_partial=True)

    assert len(merged) == 4
    assert list(merged["date"]) == ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]
    # Check status
    assert merged.loc[0, "observation_status"] == "complete"
    assert merged.loc[1, "observation_status"] == "complete"
    assert merged.loc[2, "observation_status"] == "complete"
    assert merged.loc[3, "observation_status"] == "partial_or_near_real_time"
    # Check moving average
    assert merged.loc[0, "moving_avg_7d"] == 10.0
    assert merged.loc[1, "moving_avg_7d"] == 15.0  # (10 + 20) / 2
    assert merged.loc[2, "moving_avg_7d"] == 20.0  # (10 + 20 + 30) / 3
    assert merged.loc[3, "moving_avg_7d"] == 25.0  # (10 + 20 + 30 + 40) / 4
