import json
import os
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(
    title="GeoSense AI Backend",
    description="Backend API for GeoSense AI - Environmental Hotspot Activity Forecast",
    version="1.2.0"
)

# Configure secure CORS origins (local development and preview hosts)
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# Paths to processed datasets and models
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROCESSED_DIR = os.path.join(BASE_DIR, "DATA", "processed")
GLOBAL_CSV_PATH = os.path.join(PROCESSED_DIR, "daily_global_hotspots.csv")
COUNTRY_CSV_PATH = os.path.join(PROCESSED_DIR, "annual_country_summaries_2025.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
EVAL_RESULTS_PATH = os.path.join(MODELS_DIR, "model_evaluation_results.json")
MODEL_FILE_PATH = os.path.join(MODELS_DIR, "random_forest_forecaster.joblib")


# In-memory caches with filesystem mtime validation
_GLOBAL_DF_CACHE: Optional[pd.DataFrame] = None
_GLOBAL_DF_MTIME: float = 0.0

_COUNTRY_DF_CACHE: Optional[pd.DataFrame] = None
_COUNTRY_DF_MTIME: float = 0.0

_EVAL_DATA_CACHE: Optional[dict] = None
_EVAL_DATA_MTIME: float = 0.0


def get_global_data() -> pd.DataFrame:
    """
    Load and return processed global time-series DataFrame.
    Uses in-memory caching with filesystem mtime invalidation to eliminate repeated disk reads.
    """
    global _GLOBAL_DF_CACHE, _GLOBAL_DF_MTIME
    if not os.path.isfile(GLOBAL_CSV_PATH):
        raise HTTPException(
            status_code=503,
            detail="Processed global time-series not found. Run Stage 4 pipeline first."
        )
    mtime = os.path.getmtime(GLOBAL_CSV_PATH)
    if _GLOBAL_DF_CACHE is None or mtime != _GLOBAL_DF_MTIME:
        _GLOBAL_DF_CACHE = pd.read_csv(GLOBAL_CSV_PATH)
        _GLOBAL_DF_MTIME = mtime
    return _GLOBAL_DF_CACHE.copy()


def get_country_data() -> pd.DataFrame:
    """
    Load and return processed 2025 country summaries.
    Uses in-memory caching with filesystem mtime invalidation.
    """
    global _COUNTRY_DF_CACHE, _COUNTRY_DF_MTIME
    if not os.path.isfile(COUNTRY_CSV_PATH):
        raise HTTPException(
            status_code=503,
            detail="Processed country summaries not found. Run Stage 4 pipeline first."
        )
    mtime = os.path.getmtime(COUNTRY_CSV_PATH)
    if _COUNTRY_DF_CACHE is None or mtime != _COUNTRY_DF_MTIME:
        _COUNTRY_DF_CACHE = pd.read_csv(COUNTRY_CSV_PATH)
        _COUNTRY_DF_MTIME = mtime
    return _COUNTRY_DF_CACHE.copy()


def get_model_evaluation_data() -> dict:
    """
    Load and return saved model evaluation results.
    Uses in-memory caching with filesystem mtime invalidation.
    """
    global _EVAL_DATA_CACHE, _EVAL_DATA_MTIME
    if not os.path.isfile(EVAL_RESULTS_PATH):
        raise HTTPException(
            status_code=503,
            detail="Model evaluation results not found. Run Stage 5 training pipeline first."
        )
    mtime = os.path.getmtime(EVAL_RESULTS_PATH)
    if _EVAL_DATA_CACHE is None or mtime != _EVAL_DATA_MTIME:
        with open(EVAL_RESULTS_PATH, "r", encoding="utf-8") as f:
            _EVAL_DATA_CACHE = json.load(f)
        _EVAL_DATA_MTIME = mtime
    return _EVAL_DATA_CACHE


@app.get("/")
def read_root():
    return {
        "service": "GeoSense AI Backend API",
        "version": "1.2.0",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/health",
        "endpoints": {
            "global_time_series": "/api/time-series/global",
            "summary_metrics": "/api/time-series/summary",
            "countries": "/api/countries",
            "next_day_forecast": "/api/forecast/next-day",
            "model_evaluation": "/api/models/evaluation",
            "data_quality": "/api/data-quality"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint confirming service status, dataset availability, and model readiness."""
    data_available = os.path.isfile(GLOBAL_CSV_PATH)
    models_available = os.path.isfile(EVAL_RESULTS_PATH) and os.path.isfile(MODEL_FILE_PATH)
    return {
        "status": "healthy",
        "service": "GeoSense AI Backend",
        "message": "Backend is running successfully",
        "stage": "Stage 5 Forecasting Models Trained & Connected",
        "processed_data_available": data_available,
        "models_available": models_available
    }


@app.get("/api/time-series/summary")
def get_summary_metrics():
    """
    Returns high-level summary KPIs derived from authentic NASA FIRMS observations.
    """
    df = get_global_data()
    if df.empty:
        raise HTTPException(status_code=404, detail="No observations found.")

    # Sort by date
    df = df.sort_values("date").reset_index(drop=True)
    
    # Identify latest complete date vs latest record
    latest_row = df.iloc[-1]
    is_latest_partial = latest_row["observation_status"] == "partial_or_near_real_time"

    # Use the latest complete date for reliable delta and 7-day average comparisons
    complete_df = df[df["observation_status"] == "complete"]
    latest_complete_row = complete_df.iloc[-1] if not complete_df.empty else latest_row
    
    prev_complete_idx = complete_df.index[-2] if len(complete_df) >= 2 else complete_df.index[-1]
    prev_complete_row = df.loc[prev_complete_idx]

    delta_24h = int(latest_complete_row["detection_count"] - prev_complete_row["detection_count"])

    # Last 30 complete days peak
    last_30_complete = complete_df.tail(30)
    peak_30d = int(last_30_complete["detection_count"].max())
    peak_30d_date = str(last_30_complete.loc[last_30_complete["detection_count"].idxmax(), "date"])

    all_time_peak_idx = df["detection_count"].idxmax()
    all_time_peak = int(df.loc[all_time_peak_idx, "detection_count"])
    all_time_peak_date = str(df.loc[all_time_peak_idx, "date"])

    return {
        "provenance": {
            "satellite": "NOAA-20 (JPSS-1)",
            "instrument": "VIIRS (Visible Infrared Imaging Radiometer Suite, 375m)",
            "total_records_processed": 33723945,
            "total_consecutive_days": len(df),
            "date_range": {
                "start": str(df["date"].min()),
                "end": str(df["date"].max())
            }
        },
        "latest_observation": {
            "date": str(latest_row["date"]),
            "detection_count": int(latest_row["detection_count"]),
            "high_confidence_count": int(latest_row["high_confidence_count"]),
            "mean_frp_mw": float(latest_row["mean_frp"]),
            "observation_status": str(latest_row["observation_status"]),
            "source_product": str(latest_row["source_product"])
        },
        "latest_complete_day": {
            "date": str(latest_complete_row["date"]),
            "detection_count": int(latest_complete_row["detection_count"]),
            "previous_day_count": int(prev_complete_row["detection_count"]),
            "delta_24h": delta_24h,
            "seven_day_moving_avg": float(latest_complete_row["moving_avg_7d"]),
            "mean_frp_mw": float(latest_complete_row["mean_frp"])
        },
        "records_summary": {
            "peak_30d_count": peak_30d,
            "peak_30d_date": peak_30d_date,
            "all_time_peak_count": all_time_peak,
            "all_time_peak_date": all_time_peak_date,
            "total_detections_sum": int(df["detection_count"].sum())
        }
    }


@app.get("/api/time-series/global")
def get_global_time_series(
    days: Optional[int] = Query(None, ge=1, le=1000, description="Limit to last N days (1 to 1000)"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date YYYY-MM-DD")
):
    """
    Returns the daily global hotspot observation time-series.
    """
    # Normalize inputs when invoked directly in tests without FastAPI Dependency Injection
    s_date = start_date if isinstance(start_date, str) else None
    e_date = end_date if isinstance(end_date, str) else None
    d_days = days if isinstance(days, int) else None

    if s_date and e_date and s_date > e_date:
        raise HTTPException(
            status_code=400,
            detail=f"start_date ({s_date}) cannot be later than end_date ({e_date})"
        )

    df = get_global_data()
    total_days = len(df)
    df = df.sort_values("date").reset_index(drop=True)

    if s_date:
        df = df[df["date"] >= s_date]
    if e_date:
        df = df[df["date"] <= e_date]
    if d_days is not None:
        df = df.tail(d_days)

    records = df.to_dict(orient="records")
    # Clean NaN values for JSON compliance
    for r in records:
        if pd.isna(r.get("vegetation_fire_count")):
            r["vegetation_fire_count"] = None

    return {
        "status": "success",
        "returned_count": len(records),
        "total_available_days": total_days,
        "records": records
    }


@app.get("/api/countries")
def get_country_summaries(limit: int = Query(50, ge=1, le=250)):
    """
    Returns annual country summaries derived from the 2025 VIIRS NOAA-20 archive.
    """
    df = get_country_data()
    df = df.head(limit)
    return {
        "status": "success",
        "total_countries": len(df),
        "countries": df.to_dict(orient="records")
    }


@app.get("/api/forecast/next-day")
def get_next_day_forecast():
    """
    Returns the next-day active-fire count forecast produced by the trained Random Forest Regressor
    along with the persistence and 7-day moving average baselines, target date, and confidence intervals.
    """
    data = get_model_evaluation_data()
    forecast = data.get("next_day_forecast", {})
    metadata = data.get("metadata", {})
    comparison = data.get("evaluation_summary", {}).get("comparison", {})
    test_metrics = data.get("evaluation_summary", {}).get("test_metrics", {})

    # Sanitize count forecasts: ensure strictly non-negative and finite values
    sanitized_forecast = dict(forecast)
    for int_key in ["predicted_count_rounded", "predicted_count_persistence", "lower_bound_approx", "upper_bound_approx"]:
        val = sanitized_forecast.get(int_key)
        if val is not None:
            try:
                sanitized_forecast[int_key] = max(0, int(round(float(val))))
            except (ValueError, TypeError):
                pass
    for float_key in ["predicted_count_rf", "predicted_count_ma7"]:
        val = sanitized_forecast.get(float_key)
        if val is not None:
            try:
                sanitized_forecast[float_key] = max(0.0, float(val))
            except (ValueError, TypeError):
                pass

    return {
        "status": "success",
        "provenance": {
            "satellite_product": metadata.get("satellite_product", "NOAA-20 (JPSS-1) VIIRS 375m"),
            "coverage_scope": metadata.get("coverage_scope", "Global Hotspot Detections"),
            "trained_days": metadata.get("train_days"),
            "test_days": metadata.get("test_days")
        },
        "forecast": sanitized_forecast,
        "model_comparison": {
            "rf_mae": test_metrics.get("random_forest", {}).get("mae"),
            "persistence_mae": test_metrics.get("previous_day_baseline", {}).get("mae"),
            "ma7_mae": test_metrics.get("seven_day_moving_avg", {}).get("mae"),
            "best_model_on_test_mae": comparison.get("best_model_on_test_mae")
        }
    }


@app.get("/api/models/evaluation")
def get_models_evaluation():
    """
    Returns full empirical evaluation metrics for Random Forest Regressor and both baselines
    across the identical held-out test dates, including feature importances and daily test traces.
    """
    data = get_model_evaluation_data()
    return {
        "status": "success",
        "metadata": data.get("metadata"),
        "evaluation_summary": data.get("evaluation_summary"),
        "next_day_forecast": data.get("next_day_forecast"),
        "test_daily_records": data.get("test_daily_records", [])
    }


@app.get("/api/data-quality")
def get_data_quality_audit():
    """
    Returns data quality, sensor specifications, and processing pipeline audit metadata
    derived directly from the validated NASA FIRMS dataset and inspection reports.
    """
    df = get_global_data()
    total_days = len(df)
    complete_days = len(df[df["observation_status"] == "complete"])
    partial_days = len(df[df["observation_status"] != "complete"])
    
    return {
        "status": "success",
        "provenance": {
            "satellite": "NOAA-20 (JPSS-1)",
            "instrument": "VIIRS (Visible Infrared Imaging Radiometer Suite, 375m)",
            "total_files_processed": 220,
            "total_records_processed": 33723945,
            "consecutive_days_span": total_days,
            "date_range": {
                "start": str(df["date"].min()),
                "end": str(df["date"].max())
            },
            "missing_days_count": 0,
            "complete_days_count": complete_days,
            "partial_nrt_days_count": partial_days,
            "partial_date": "2026-10-16",
            "partial_detections": 16952,
            "deduplication_strategy": "Pure NOAA-20 isolation. Zero mixing with NOAA-21 or MODIS.",
            "spatial_resolution": "375 meters at nadir",
            "spectral_bands": "I4 (3.74-3.96 μm) and I5 (11.0-12.0 μm)",
            "processing_versions": {
                "2025_archive": "VNP14IMGTDL (Standard Archive, 217 Country Files)",
                "2026_archive": "VNP14IMGTDL (Global Archive, 2026-01-01 to 2026-06-30)",
                "2026_nrt": "VNP14IMGT_NRT (Near-Real-Time, 2026-07-01 to 2026-10-16)"
            },
            "known_limitations": [
                "Low-Earth Orbit pass cadence: Observations occur during sun-synchronous overhead passes (~1:30 PM/AM local solar time).",
                "Cloud attenuation: Heavy convective cloud decks shield surface thermal radiance during storm events.",
                "Near-real-time lag: The final observation day (2026-10-16) contains partial downlinks (16,952 fires) and is flagged as partial_or_near_real_time.",
                "Sub-canopy fires: Intense smoldering in dense peat or closed canopy may under-register relative to open surface crowns."
            ]
        }
    }


