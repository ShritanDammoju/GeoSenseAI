# GeoSense AI — Data Processing Pipeline Report (Stage 4)

**Generated:** 2026-10-16 19:24:14  
**Processing Duration:** 232.0 seconds (Chunked streaming across 33.72M raw detections)  
**Output Location:** `DATA/processed/`  
**Primary Output File:** `DATA/processed/daily_global_hotspots.csv`  

---

## 1. Executive Summary

The GeoSense AI data processing pipeline successfully converted **33,723,945 raw satellite active-fire detections** into clean, validated daily time-series datasets.

Processing was executed using memory-efficient chunked streaming across all 217 country CSV files and both multi-million row 2026 global files. All original raw files in `DATA/raw/` remain 100% unaltered.

### Key Metrics:
* **Total Days Processed:** 654 consecutive calendar days
* **Observation Date Span:** `2025-01-01` to `2026-10-16` (unbroken time-series)
* **Total Global Detections:** 33,723,945
* **Mean Daily Detection Count:** 51,565.7 fires / day
* **Peak Detection Spike:** 134,678 fires on `2026-09-01` (Source: VIIRS_NOAA20_V2NRT_Global_NRT)
* **Missing Calendar Dates:** **0** (No missing days in observation record)
* **Satellite Instrument:** 100% NOAA-20 VIIRS (375m spatial resolution)

---

## 2. Input Datasets & Processing Strategy

| Input File / Folder | Input Records | Date Coverage | Processing Chunk Size | Role & Output Contribution |
| :--- | :--- | :--- | :--- | :--- |
| `DATA/raw/viirs-jpss1_2025_all_countries/viirs-jpss1/2025/*.csv` (217 files) | 18,376,493 | 2025-01-01 to 2025-12-31 (365 days) | 150,000 rows | Sovereign landmass daily counts; aggregated into 2025 daily series and country summaries. |
| `DATA/raw/DL_FIRE_J1V-C2_42816/fire_archive_J1V-C2_42816.csv` | 7,389,174 | 2026-01-01 to 2026-06-30 (181 days) | 250,000 rows | Standard science archive global daily counts; land cover `type` classified. |
| `DATA/raw/DL_FIRE_J1V-C2_42816/fire_nrt_J1V-C2_42816.csv` | 7,958,278 | 2026-07-01 to 2026-10-16 (108 days) | 250,000 rows | Near-real-time global daily counts; up to current date. |
| **Combined** | **33,723,945** | **654 consecutive days** | — | Single unified daily time-series table. |

---

## 3. Deduplication, Exclusions & Boundary Handling

1. **NOAA-20 vs Other Satellites:**
   * All raw records are uniformly from `satellite: N20` (NOAA-20 / JPSS-1). No NOAA-21 or MODIS data was mixed into this dataset.
2. **Transition Boundary (June 30 / July 1, 2026):**
   * Standard archive ended on `2026-06-30` (55,244 detections).
   * Near-real-time product started on `2026-07-01` (55,497 detections).
   * There was zero date overlap, ensuring no double-counting during the transition.
3. **Observation Status Labeling:**
   * Days from `2025-01-01` through `2026-10-15` are labeled as `observation_status: complete`.
   * The most recent observation date (`2026-10-16`) is explicitly labeled as `observation_status: partial_or_near_real_time` to prevent false zero or false dip assumptions while orbits are actively streaming.

---

## 4. Output Artifact Schema (`DATA/processed/daily_global_hotspots.csv`)

| Column Name | Data Type | Physical Definition |
| :--- | :--- | :--- |
| `date` | String (`YYYY-MM-DD`) | Calendar observation date in Universal Coordinated Time (UTC). |
| `detection_count` | Integer | Total count of thermal anomaly fire pixels detected by VIIRS on NOAA-20 on that date. |
| `high_confidence_count` | Integer | Detections with `confidence == 'h'` (highest certainty, minimal false alarm probability). |
| `vegetation_fire_count` | Integer / Null | Presumed vegetation fires (`type == '0'`). Omitted/Null for NRT data where `type` is not classified. |
| `mean_frp` | Float (MW) | Arithmetic mean of Fire Radiative Power in Megawatts for detections with valid positive FRP. |
| `total_frp` | Float (MW) | Sum of total radiant heat energy emitted across all detections on that date. |
| `moving_avg_7d` | Float | 7-day trailing rolling mean of daily detection count to smooth high-frequency sensor noise. |
| `source_product` | String | Data provenance identifier (`VIIRS_NOAA20_V2_Country_Archive`, `VIIRS_NOAA20_V2_Global_Archive`, or `VIIRS_NOAA20_V2NRT_Global_NRT`). |
| `coverage_scope` | String | Spatial boundary scope (`sovereign_landmasses_217_countries` vs `global_terrestrial_and_maritime`). |
| `observation_status` | String | Observation completeness indicator (`complete` vs `partial_or_near_real_time`). |

---

## 5. Annual Country Summaries (2025 Archive Highlights)

Top 10 countries by detection volume in `DATA/processed/annual_country_summaries_2025.csv`:

| Country | Total Detections | Vegetation Fires | High Confidence | Mean FRP (MW) | Days Active |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Democratic_Republic_of_the_Congo | 1,950,010 | 1,929,507 | 95,710 | 10.79 | 365 |
| Angola | 1,255,715 | 1,255,093 | 103,715 | 13.25 | 365 |
| Australia | 1,247,851 | 1,236,288 | 83,978 | 11.37 | 365 |
| Canada | 925,148 | 884,556 | 42,178 | 15.72 | 365 |
| Zambia | 860,439 | 858,923 | 56,414 | 9.5 | 347 |
| Brazil | 853,909 | 837,867 | 45,815 | 11.02 | 365 |
| Mozambique | 749,438 | 747,374 | 45,311 | 8.59 | 361 |
| South_Sudan | 706,266 | 706,239 | 38,173 | 10.38 | 361 |
| India | 655,554 | 576,285 | 16,499 | 6.17 | 365 |
| Russian_Federation | 585,993 | 453,137 | 26,162 | 10.29 | 365 |

---

## 6. Known Limitations & Technical Constraints

1. **Spatial Coverage Discrepancy between 2025 and 2026:**
   * 2025 data sums 217 sovereign country files, capturing all terrestrial and coastal sovereign landmasses but omitting open-ocean gas flares.
   * 2026 data covers the entire global bounding box including marine points (~0.8% of archive).
2. **NRT Surface Type Masking:**
   * In 2026 Near-Real-Time observations (July 1 to October 16), NASA does not include the `type` column. Therefore, `vegetation_fire_count` is marked as null during this window.
3. **Cloud & Weather Dropout:**
   * Satellite optical sensors cannot penetrate dense storm cloud decks. Zero fire counts in rainy biomes reflect either extinguished fires or temporary cloud obscuration.
