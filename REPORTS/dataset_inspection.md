# GeoSense AI — Dataset Inspection & Validation Report (Stage 3)

**Author:** GeoSense AI Pipeline  
**Date of Inspection:** October 16, 2026  
**Status:** Completed & Validated  
**Inspection Target Folders:**
1. `DATA/raw/DL_FIRE_J1V-C2_42816/`
2. `DATA/raw/viirs-jpss1_2025_all_countries/viirs-jpss1/2025/`

---

## 1. Executive Summary

This report provides a comprehensive, rigorous inspection of the NASA FIRMS (Fire Information for Resource Management System) raw satellite datasets provided for the **GeoSense AI** environmental hotspot activity forecasting project.

All files were analyzed using memory-efficient streaming algorithms without altering, renaming, or deleting any raw telemetry. Across all inspected files, **33,723,945 individual satellite active fire detections** were validated.

### Key Takeaways for Beginners:
* **Satellite & Instrument Consistency:** 100% of the detections in both 2025 and 2026 come from a single, consistent satellite sensor: **NOAA-20 (JPSS-1)** carrying the **VIIRS (Visible Infrared Imaging Radiometer Suite)** instrument. There is zero contamination from NOAA-21 or MODIS.
* **Granularity:** Both the 2025 and 2026 datasets consist of **individual, pixel-level satellite detection points** (latitude, longitude, brightness temperature, fire radiative power, time of pass), rather than pre-aggregated summary counts.
* **Temporal Coverage:** 
  * **2025:** Continuous coverage from **January 1, 2025 to December 31, 2025** (365 out of 365 days present, 0 missing days).
  * **2026:** Continuous coverage from **January 1, 2026 to October 16, 2026** (289 out of 289 days present, 0 missing days).
* **Zero Date Overlap:** In 2026, the standard science archive ends on June 30, 2026, and the Near-Real-Time (NRT) stream begins on July 1, 2026 with no duplicate calendar days.
* **Data Integrity:** **Zero missing values** across mandatory telemetry fields, and **zero invalid geographic coordinates** across all 33.72 million records.

---

## 2. Directory Structure & File Inventory

```text
DATA/raw/
├── DL_FIRE_J1V-C2_42816/                             [1,205.43 MB / 3 files]
│   ├── fire_archive_J1V-C2_42816.csv                 (567.01 MB | 7,389,174 rows)
│   ├── fire_nrt_J1V-C2_42816.csv                     (638.42 MB | 7,958,278 rows)
│   └── Readme.txt                                    (89 bytes)
│
└── viirs-jpss1_2025_all_countries/                   [1,415.94 MB / 218 files]
    └── viirs-jpss1/
        └── 2025/                                     [Nested Subdirectory]
            ├── AttributesReadme.txt                  (4.5 KB)
            ├── viirs-jpss1_2025_Afghanistan.csv      (0.07 MB | 924 rows)
            ├── viirs-jpss1_2025_Australia.csv        (97.91 MB | 1,247,851 rows)
            ├── viirs-jpss1_2025_Brazil.csv           (66.59 MB | 853,909 rows)
            ├── viirs-jpss1_2025_Canada.csv           (72.48 MB | 925,148 rows)
            ├── viirs-jpss1_2025_Democratic_Republic_of_the_Congo.csv (149.36 MB | 1,950,010 rows)
            ├── ... [212 additional country CSV files]
            └── viirs-jpss1_2025_Zimbabwe.csv         (6.48 MB | 83,165 rows)
```

---

## 3. Dataset Specifications & Metrics

| Metric | 2025 Country Archive (`viirs-jpss1`) | 2026 Standard Archive (`fire_archive`) | 2026 Near-Real-Time (`fire_nrt`) | Combined Total |
| :--- | :--- | :--- | :--- | :--- |
| **Folder Location** | `.../viirs-jpss1/2025/` | `.../DL_FIRE_J1V-C2_42816/` | `.../DL_FIRE_J1V-C2_42816/` | — |
| **File Count** | 217 CSVs + 1 TXT | 1 CSV | 1 CSV | **220 CSVs + 2 TXT** |
| **Total Disk Size** | 1,415.93 MB | 567.01 MB | 638.42 MB | **2,621.36 MB (~2.62 GB)** |
| **Record Count** | 18,376,493 rows | 7,389,174 rows | 7,958,278 rows | **33,723,945 rows** |
| **Observation Type**| Individual Point Detections | Individual Point Detections | Individual Point Detections | Individual Point Detections |
| **Start Date** | `2025-01-01` | `2026-01-01` | `2026-07-01` | **`2025-01-01`** |
| **End Date** | `2025-12-31` | `2026-06-30` | `2026-10-16` | **`2026-10-16`** |
| **Calendar Days** | 365 days (100%) | 181 days (100%) | 108 days (100%) | **654 consecutive days** |
| **Missing Days** | **0** | **0** | **0** | **0 days** |
| **Satellite** | `N20` (NOAA-20 / JPSS-1) | `N20` (NOAA-20 / JPSS-1) | `N20` (NOAA-20 / JPSS-1) | **100% NOAA-20** |
| **Instrument** | `VIIRS` (375m I-bands) | `VIIRS` (375m I-bands) | `VIIRS` (375m I-bands) | **100% VIIRS** |
| **Processing Version**| `2` (Collection 2 Archive)| `2` (Collection 2 Archive)| `2.0NRT` (Near-Real-Time)| Standard vs. NRT |
| **Latitude Range** | `[-89.14716, 80.36205]` | `[-83.18034, 73.23364]` | `[-86.38520, 75.09420]` | Global |
| **Longitude Range** | `[-179.83984, 179.99434]`| `[-179.83412, 179.64174]`| `[-179.98198, 179.95056]`| Global |
| **Invalid Coords** | **0** | **0** | **0** | **0** |
| **Missing Values** | **0** | **0** | **0** | **0** |

---

## 4. Column Schema Comparison & Alignments

A vital finding of this inspection is that the column headers between the 2025 country downloads and the 2026 global downloads have minor naming variations representing the exact same physical quantities:

| Attribute Meaning | 2025 Country CSV Header | 2026 Archive Header | 2026 NRT Header | Status / Alignment Rule |
| :--- | :--- | :--- | :--- | :--- |
| Latitude (WGS84) | `latitude` | `latitude` | `latitude` | Identical |
| Longitude (WGS84) | `longitude` | `longitude` | `longitude` | Identical |
| 4μm Thermal Brightness | `bright_ti4` | `brightness` | `brightness` | Map `bright_ti4` ↔ `brightness` |
| Along-scan pixel size | `scan` | `scan` | `scan` | Identical |
| Along-track pixel size | `track` | `track` | `track` | Identical |
| Acquisition Date | `acq_date` (YYYY-MM-DD) | `acq_date` (YYYY-MM-DD) | `acq_date` (YYYY-MM-DD) | Identical |
| Acquisition Time (UTC) | `acq_time` (HHMM) | `acq_time` (HHMM) | `acq_time` (HHMM) | Identical |
| Satellite Identifier | `satellite` (`N20`) | `satellite` (`N20`) | `satellite` (`N20`) | Identical |
| Sensor Instrument | `instrument` (`VIIRS`) | `instrument` (`VIIRS`) | `instrument` (`VIIRS`) | Identical |
| Detection Confidence | `confidence` (`l`,`n`,`h`) | `confidence` (`l`,`n`,`h`) | `confidence` (`l`,`n`,`h`) | Identical |
| Processing Version | `version` (`2`) | `version` (`2`) | `version` (`2.0NRT`) | Standard Archive vs NRT |
| 11μm Thermal Brightness| `bright_ti5` | `bright_t31` | `bright_t31` | Map `bright_ti5` ↔ `bright_t31` |
| Fire Radiative Power (MW)| `frp` | `frp` | `frp` | Identical |
| Day / Night Orbit | `daynight` (`D`,`N`) | `daynight` (`D`,`N`) | `daynight` (`D`,`N`) | Identical |
| Thermal Land-Cover Type | `type` (`0`,`1`,`2`,`3`) | `type` (`0`,`1`,`2`,`3`) | *Not Available in NRT* | Filter `type == 0` for vegetation |

### Explanation of Fire Types (`type` column):
* `0`: Presumed vegetation fire (forest, brush, savanna, agricultural) — **~91.5% of all archive detections**.
* `1`: Active volcanism — **~0.2%**.
* `2`: Other static land sources (industrial exhaust, refineries, steel mills) — **~7.5%**.
* `3`: Offshore detection (marine gas flaring, oil rigs) — **~0.5%**.

> **Important Modeling Rule:** In near-real-time operations (`fire_nrt`), NASA FIRMS does not include the `type` column because surface land-cover masking is computed post-facto in the delayed science archive. When modeling across both datasets, the pipeline can either utilize static geographical land-use masks or train on total fire counts.

---

## 5. Duplicate, Overlap & Coverage Analysis

### A. Overlapping Date Ranges
* **Finding:** There is **zero overlap** between `fire_archive_J1V-C2_42816.csv` and `fire_nrt_J1V-C2_42816.csv`.
  * `fire_archive` covers `2026-01-01` to `2026-06-30` (55,244 detections on June 30).
  * `fire_nrt` begins on `2026-07-01` (55,497 detections on July 1).
  * The transition is smooth and unbroken.

### B. Cross-Country Boundary Duplicates (2025 Data)
* We performed an exact spatial-temporal hash comparison for a representative global observation day (`2025-06-15`).
* Out of 35,827 detections on that day across all 217 country files, cross-border duplicate detections were virtually zero (less than 0.003%), confirming that NASA FIRMS assigns pixels along borders to specific territorial polygons without duplicating detections across files.

### C. Suitability for Global Daily Forecasting
* **Consistency:** Both datasets are 100% NOAA-20 / VIIRS 375m, providing uniform spatial resolution and spectral response across the entire 654-day span.
* **Granularity Differences:**
  * The 2025 data is split into 217 sovereign country files.
  * The 2026 data is a global bounding box download.
  * For regional or national forecasting (e.g. North America, Amazon Basin, Australia, Central Africa), both datasets match seamlessly once filtered by coordinates or country.
  * For a single unified worldwide global count, summing the 217 country files covers sovereign landmasses, but excludes open ocean/marine gas flaring (which are filtered out for environmental wildfire modeling anyway).

---

## 6. Top Global Hotspot Regions (2025 Archive)

The top 10 countries by total annual satellite active fire detections in 2025:

1. **Democratic Republic of the Congo**: 1,950,010 detections (149.4 MB)
2. **Angola**: 1,255,715 detections (97.0 MB)
3. **Australia**: 1,247,851 detections (97.9 MB)
4. **Canada**: 925,148 detections (72.5 MB)
5. **Zambia**: 860,439 detections (66.6 MB)
6. **Brazil**: 853,909 detections (66.6 MB)
7. **Mozambique**: 749,438 detections (58.1 MB)
8. **South Sudan**: 706,266 detections (53.5 MB)
9. **India**: 655,554 detections (50.2 MB)
10. **Russian Federation**: 585,993 detections (45.2 MB)

---

## 7. Next Steps & Recommendations (Stage 4 Transition)

With the raw data fully inspected and verified, the recommended progression for Stage 4 is:

1. **Build a Unified Ingestion & Aggregation Script (`DATA/processed/`)**:
   * Standardize column headers (`bright_ti4` / `brightness`, `bright_ti5` / `bright_t31`).
   * Group point detections by calendar date (`acq_date`) and geographic region (e.g., Global, North America, Amazonia, Sub-Saharan Africa, Australia).
   * Produce lightweight, pre-aggregated daily count CSVs (under 50 KB each) storing:
     `date, total_fires, vegetation_fires, mean_frp, high_confidence_count`.
2. **Create Train/Test Temporal Splits**:
   * **Training Window:** 2025 full year (365 days) + 2026 H1 (181 days).
   * **Validation / Evaluation Window:** 2026 Q3 (July – September).
   * **Next-Day Forecast Horizon:** October 2026 Near-Real-Time stream.
3. **Connect the Backend API**:
   * Add FastAPI endpoints to serve the daily time-series to the React frontend.
