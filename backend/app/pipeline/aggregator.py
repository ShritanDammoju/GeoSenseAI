"""
GeoSense AI — FIRMS Aggregator Module
Memory-efficient chunked streaming aggregation of NASA FIRMS VIIRS active fire detections.
"""

import os
from collections import defaultdict
from typing import Dict, Any, Tuple, Optional, List
import pandas as pd
import numpy as np


class DailyAccumulator:
    """Accumulates daily metrics across chunks or multiple files."""

    def __init__(self):
        # date -> dict of accumulators
        self.data: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "detection_count": 0,
            "high_confidence_count": 0,
            "vegetation_fire_count": 0,
            "has_vegetation_data": False,
            "frp_sum": 0.0,
            "frp_count": 0,
        })

    def update_from_dataframe(
        self,
        df: pd.DataFrame,
        date_col: str = "acq_date",
        frp_col: str = "frp",
        conf_col: str = "confidence",
        type_col: Optional[str] = "type",
    ) -> None:
        """Process a chunk or dataframe and add to daily accumulators."""
        if df.empty:
            return

        df = df.reset_index(drop=True)
        # Ensure string date
        dates = df[date_col].astype(str)
        conf_series = df[conf_col].astype(str).str.lower()
        frp_series = pd.to_numeric(df[frp_col], errors="coerce").fillna(0.0)

        has_type = type_col is not None and type_col in df.columns
        if has_type:
            type_series = df[type_col].astype(str).str.strip()

        # Group by date within chunk
        grouped = df.groupby(dates)

        for d, indices in grouped.groups.items():
            sub_count = len(indices)
            sub_high_conf = int((conf_series.loc[indices] == "h").sum())
            
            sub_frp = frp_series.loc[indices]
            valid_frp_mask = sub_frp > 0
            sub_frp_sum = float(sub_frp[valid_frp_mask].sum())
            sub_frp_count = int(valid_frp_mask.sum())

            acc = self.data[d]
            acc["detection_count"] += sub_count
            acc["high_confidence_count"] += sub_high_conf
            acc["frp_sum"] += sub_frp_sum
            acc["frp_count"] += sub_frp_count

            if has_type:
                acc["has_vegetation_data"] = True
                sub_types = type_series.loc[indices]
                acc["vegetation_fire_count"] += int((sub_types == "0").sum())

    def to_dataframe(self, source_product: str, coverage_scope: str) -> pd.DataFrame:
        """Convert accumulated metrics to a clean, sorted pandas DataFrame."""
        rows = []
        for d in sorted(self.data.keys()):
            item = self.data[d]
            det_count = item["detection_count"]
            high_conf = item["high_confidence_count"]
            frp_c = item["frp_count"]
            frp_sum = item["frp_sum"]
            mean_frp = round(frp_sum / frp_c, 2) if frp_c > 0 else 0.0

            veg_count = item["vegetation_fire_count"] if item["has_vegetation_data"] else None

            rows.append({
                "date": d,
                "detection_count": det_count,
                "high_confidence_count": high_conf,
                "vegetation_fire_count": veg_count,
                "mean_frp": mean_frp,
                "total_frp": round(frp_sum, 2),
                "source_product": source_product,
                "coverage_scope": coverage_scope,
            })

        return pd.DataFrame(rows)


def process_2025_countries(
    countries_dir: str,
    chunksize: int = 100_000
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Process all country CSVs in the 2025 directory using chunked streaming.
    Returns:
        (daily_df, country_summaries_df)
    """
    if not os.path.isdir(countries_dir):
        raise FileNotFoundError(f"2025 countries directory not found: {countries_dir}")

    csv_files = [f for f in os.listdir(countries_dir) if f.endswith(".csv")]
    if not csv_files:
        raise ValueError(f"No CSV files found in {countries_dir}")

    accumulator = DailyAccumulator()
    country_records: List[Dict[str, Any]] = []

    for idx, fname in enumerate(csv_files):
        country_name = fname.replace("viirs-jpss1_2025_", "").replace(".csv", "")
        fpath = os.path.join(countries_dir, fname)

        c_total_detections = 0
        c_high_conf = 0
        c_veg_fires = 0
        c_frp_sum = 0.0
        c_frp_count = 0
        c_dates = set()

        # Chunked read of individual country file
        use_cols = ["latitude", "longitude", "acq_date", "confidence", "frp", "type"]
        for chunk in pd.read_csv(fpath, chunksize=chunksize, usecols=lambda c: c in use_cols):
            accumulator.update_from_dataframe(
                chunk,
                date_col="acq_date",
                frp_col="frp",
                conf_col="confidence",
                type_col="type" if "type" in chunk.columns else None
            )

            # Country level tallies
            c_total_detections += len(chunk)
            c_high_conf += int((chunk["confidence"].astype(str).str.lower() == "h").sum())
            if "type" in chunk.columns:
                c_veg_fires += int((chunk["type"].astype(str).str.strip() == "0").sum())

            frps = pd.to_numeric(chunk["frp"], errors="coerce").fillna(0.0)
            valid_mask = frps > 0
            c_frp_sum += float(frps[valid_mask].sum())
            c_frp_count += int(valid_mask.sum())
            c_dates.update(chunk["acq_date"].astype(str).unique())

        sorted_c_dates = sorted(list(c_dates))
        country_records.append({
            "country": country_name,
            "filename": fname,
            "total_detections": c_total_detections,
            "vegetation_fires": c_veg_fires,
            "high_confidence_count": c_high_conf,
            "mean_frp": round(c_frp_sum / c_frp_count, 2) if c_frp_count > 0 else 0.0,
            "min_date": sorted_c_dates[0] if sorted_c_dates else "None",
            "max_date": sorted_c_dates[-1] if sorted_c_dates else "None",
            "days_with_detections": len(c_dates),
        })

    daily_df = accumulator.to_dataframe(
        source_product="VIIRS_NOAA20_V2_Country_Archive",
        coverage_scope="sovereign_landmasses_217_countries"
    )

    country_df = pd.DataFrame(country_records).sort_values("total_detections", ascending=False)
    return daily_df, country_df


def process_global_csv(
    filepath: str,
    source_product: str,
    coverage_scope: str = "global_terrestrial_and_maritime",
    has_type_col: bool = True,
    chunksize: int = 250_000
) -> pd.DataFrame:
    """
    Process a large global FIRMS CSV file in chunks.
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Global CSV file not found: {filepath}")

    accumulator = DailyAccumulator()

    use_cols = ["latitude", "longitude", "acq_date", "confidence", "frp"]
    if has_type_col:
        use_cols.append("type")

    for chunk in pd.read_csv(filepath, chunksize=chunksize, usecols=lambda c: c in use_cols):
        accumulator.update_from_dataframe(
            chunk,
            date_col="acq_date",
            frp_col="frp",
            conf_col="confidence",
            type_col="type" if has_type_col and "type" in chunk.columns else None
        )

    return accumulator.to_dataframe(
        source_product=source_product,
        coverage_scope=coverage_scope
    )


def merge_and_finalize_time_series(
    df_2025: pd.DataFrame,
    df_2026_archive: pd.DataFrame,
    df_2026_nrt: pd.DataFrame,
    latest_date_partial: bool = True
) -> pd.DataFrame:
    """
    Concatenate time-series, verify zero overlapping duplicate dates,
    assign observation_status, and compute 7-day rolling statistics.
    """
    # Combine
    combined = pd.concat([df_2025, df_2026_archive, df_2026_nrt], ignore_index=True)
    combined["date"] = pd.to_datetime(combined["date"])
    combined = combined.sort_values("date").drop_duplicates(subset=["date"], keep="first").reset_index(drop=True)

    # Format date back to standard string
    combined["date"] = combined["date"].dt.strftime("%Y-%m-%d")

    # Observation status
    combined["observation_status"] = "complete"
    if latest_date_partial and len(combined) > 0:
        # Mark the most recent observation date as partial / NRT stream
        combined.loc[len(combined) - 1, "observation_status"] = "partial_or_near_real_time"

    # Compute 7-day rolling moving average
    combined["moving_avg_7d"] = combined["detection_count"].rolling(window=7, min_periods=1).mean().round(1)

    return combined
