export type TabType = 
  | 'overview' 
  | 'trends' 
  | 'forecast' 
  | 'models' 
  | 'map' 
  | 'quality' 
  | 'methodology';

export type ViewStateType = 'normal' | 'loading' | 'empty' | 'error';

export type DateRangeOption = '7d' | '14d' | '30d' | '60d' | 'all';

export interface DailyObservation {
  date: string;
  count: number;
  movingAverage7d?: number;
  satellite: 'VIIRS (375m)' | 'MODIS (1km)' | 'VIIRS NOAA-20 (375m)';
  confidenceLevel: 'High' | 'Nominal' | 'Low';
  cloudCoverEstimatePct: number;
  meanFRP?: number;
  totalFRP?: number;
  observationStatus?: string;
  sourceProduct?: string;
}

export interface RegionData {
  id: string;
  name: string;
  description: string;
  biome: string;
  coordinatesApprox: string;
  latestObservedDate: string;
  latestObservedCount: number;
  predictedNextDayCount: number;
  predictionRange: [number, number];
  twentyFourHourDelta: number;
  sevenDayAverage: number;
  peakDayCount: number;
  observations: DailyObservation[];
  isAuthenticData?: boolean;
  totalDetectionsAllTime?: number;
  meanDailyFRP?: number;
  observationStatus?: string;
  sourceProduct?: string;
  targetForecastDate?: string;
  forecastModelName?: string;
  forecastConfidenceMAE?: number;
}


export interface ProcessedDailyRecord {
  date: string;
  detection_count: number;
  high_confidence_count: number;
  vegetation_fire_count: number | null;
  mean_frp: number;
  total_frp: number;
  moving_avg_7d: number;
  source_product: string;
  coverage_scope: string;
  observation_status: string;
}

export interface SummaryMetricsResponse {
  provenance: {
    satellite: string;
    instrument: string;
    total_records_processed: number;
    total_consecutive_days: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  latest_observation: {
    date: string;
    detection_count: number;
    high_confidence_count: number;
    mean_frp_mw: number;
    observation_status: string;
    source_product: string;
  };
  latest_complete_day: {
    date: string;
    detection_count: number;
    previous_day_count: number;
    delta_24h: number;
    seven_day_moving_avg: number;
    mean_frp_mw: number;
  };
  records_summary: {
    peak_30d_count: number;
    peak_30d_date: string;
    all_time_peak_count: number;
    all_time_peak_date: string;
    total_detections_sum: number;
  };
}

export interface ModelBenchmark {
  modelName: string;
  type: 'Baseline' | 'Statistical' | 'Machine Learning';
  description: string;
  formulaOrApproach: string;
  maeSample: number;
  rmseSample: number;
  latencyMs: number;
  advantages: string;
  limitations: string;
  isRecommended: boolean;
}

export interface BackendHealth {
  status: string;
  service: string;
  message: string;
  stage?: string;
  processed_data_available?: boolean;
  models_available?: boolean;
  firms_map_key_configured?: boolean;
}

export interface NextDayForecastPayload {
  status: string;
  provenance: {
    satellite_product: string;
    coverage_scope: string;
    trained_days: number;
    test_days: number;
  };
  forecast: {
    reference_observation_date: string;
    target_forecast_date: string;
    reference_observed_count: number;
    predicted_count_rf: number;
    predicted_count_rounded: number;
    predicted_count_persistence: number;
    predicted_count_ma7: number;
    expected_24h_change: number;
    model_used: string;
    confidence_band_mae: number;
    lower_bound_approx: number;
    upper_bound_approx: number;
    features_used: Record<string, number>;
  };
  model_comparison: {
    rf_mae: number;
    persistence_mae: number;
    ma7_mae: number;
    best_model_on_test_mae: string;
  };
}

export interface ModelMetricDetails {
  model_name: string;
  mae: number;
  rmse: number;
  mape_percent: number;
  r2_score: number;
  sample_count: number;
  min_true_value: number;
  max_true_value: number;
  mean_true_value: number;
}

export interface TestDailyRecord {
  date: string;
  actual_count: number;
  rf_prediction: number;
  persistence_prediction: number;
  ma7_prediction: number;
  rf_error: number;
}

export interface ModelEvaluationPayload {
  status: string;
  metadata: {
    satellite_product: string;
    coverage_scope: string;
    total_complete_days: number;
    date_range: { start: string; end: string };
    train_days: number;
    val_days: number;
    test_days: number;
    split_dates: {
      train_end: string;
      val_start: string;
      val_end: string;
      test_start: string;
      test_end: string;
    };
  };
  evaluation_summary: {
    test_metrics: {
      random_forest: ModelMetricDetails;
      previous_day_baseline: ModelMetricDetails;
      seven_day_moving_avg: ModelMetricDetails;
    };
    validation_metrics: {
      random_forest: ModelMetricDetails;
    };
    comparison: {
      rf_vs_persistence_mae_improvement: number;
      rf_vs_persistence_mae_pct: number;
      rf_vs_ma7_mae_improvement: number;
      rf_vs_ma7_mae_pct: number;
      best_model_on_test_mae: string;
    };
    feature_importances: Record<string, number>;
    mape_scientific_note: string;
  };
  next_day_forecast: NextDayForecastPayload['forecast'];
  test_daily_records: TestDailyRecord[];
}

export interface DataQualityAuditPayload {
  status: string;
  provenance: {
    satellite: string;
    instrument: string;
    total_files_processed: number;
    total_records_processed: number;
    consecutive_days_span: number;
    date_range: {
      start: string;
      end: string;
    };
    missing_days_count: number;
    complete_days_count: number;
    partial_nrt_days_count: number;
    partial_date: string;
    partial_detections: number;
    deduplication_strategy: string;
    spatial_resolution: string;
    spectral_bands: string;
    processing_versions: {
      [key: string]: string;
    };
    known_limitations: string[];
  };
}

export interface CountrySummaryRecord {
  country: string;
  filename: string;
  total_detections: number;
  vegetation_fires: number;
  high_confidence_count: number;
  mean_frp: number;
  min_date: string;
  max_date: string;
  days_with_detections: number;
}

export interface LiveFirmsDetectionDate {
  observation_date: string;
  detection_count: number;
  mean_frp_mw: number;
  status: string;
  note: string;
}

export interface LiveFirmsPayload {
  status: string;
  source: string;
  satellite: string;
  instrument: string;
  cached: boolean;
  refresh_timestamp: string;
  total_recent_detections: number;
  days_reported: number;
  detections_by_date: LiveFirmsDetectionDate[];
  data_notice: string;
}



