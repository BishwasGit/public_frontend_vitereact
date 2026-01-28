import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

const reportHandler = (metric: Metric) => {
  // In production, send to Analytics endpoint
  console.log(metric); 
};

export const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onFCP(onPerfEntry);
    onTTFB(onPerfEntry);
  } else {
    onCLS(reportHandler);
    onINP(reportHandler);
    onLCP(reportHandler);
    onFCP(reportHandler);
    onTTFB(reportHandler);
  }
};
