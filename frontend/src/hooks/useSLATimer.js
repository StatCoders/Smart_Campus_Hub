import { useState, useEffect } from 'react';

/**
 * Calculate SLA metrics and track real-time status
 * Returns minutes to first response and resolution
 */
export const useSLATimer = (ticket) => {
  const [slaMetics, setSLAMetrics] = useState({
    minutesToFirstResponse: null,
    minutesToResolution: null,
    isOverdueFirstResponse: false,
    isOverdueResolution: false,
    status: 'on-time',
  });

  useEffect(() => {
    if (!ticket) return;

    const calculateSLA = () => {
      const now = new Date();
      const createdAt = new Date(ticket.createdAt);
      
      let metrics = {
        minutesToFirstResponse: null,
        minutesToResolution: null,
        isOverdueFirstResponse: false,
        isOverdueResolution: false,
        status: 'on-time',
      };

      // Calculate minutes to first response
      if (ticket.firstResponseAt) {
        const responseTime = new Date(ticket.firstResponseAt);
        const minutesDiff = Math.floor((responseTime - createdAt) / (1000 * 60));
        metrics.minutesToFirstResponse = minutesDiff;
        
        // SLA threshold: 4 hours (240 minutes) for first response
        if (minutesDiff > 240) {
          metrics.isOverdueFirstResponse = true;
          metrics.status = 'overdue';
        }
      } else if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED') {
        // Still waiting for first response
        const minutesWaited = Math.floor((now - createdAt) / (1000 * 60));
        if (minutesWaited > 240) {
          metrics.isOverdueFirstResponse = true;
          metrics.status = 'overdue';
        }
      }

      // Calculate minutes to resolution
      if (ticket.resolvedAt) {
        const resolutionTime = new Date(ticket.resolvedAt);
        const minutesDiff = Math.floor((resolutionTime - createdAt) / (1000 * 60));
        metrics.minutesToResolution = minutesDiff;
        
        // SLA threshold: 24 hours (1440 minutes) for resolution
        if (minutesDiff > 1440) {
          metrics.status = 'overdue';
        }
      } else if (ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED') {
        // Still waiting for resolution
        const minutesWaited = Math.floor((now - createdAt) / (1000 * 60));
        if (minutesWaited > 1440) {
          metrics.status = 'overdue';
        }
      }

      setSLAMetrics(metrics);
    };

    calculateSLA();
    
    // Update metrics every minute
    const interval = setInterval(calculateSLA, 60000);
    return () => clearInterval(interval);
  }, [ticket]);

  return slaMetics;
};

/**
 * Format minutes into readable time format
 */
export const formatMinutesToTime = (minutes) => {
  if (minutes === null || minutes === undefined) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
};

/**
 * Get SLA status color for display
 */
export const getSLAStatusColor = (isOverdue, status) => {
  if (isOverdue) return 'text-red-600 bg-red-50 border-red-200';
  if (status === 'overdue') return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-green-600 bg-green-50 border-green-200';
};
