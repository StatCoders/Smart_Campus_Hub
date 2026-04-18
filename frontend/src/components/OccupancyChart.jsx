import React, { useEffect, useState } from 'react';
import { getWeeklyOccupancy } from '../services/facilityService';

export default function OccupancyChart({ facilityId, facility }) {
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }

    const fetchOccupancy = async () => {
      try {
        setLoading(true);
        const data = await getWeeklyOccupancy(facilityId);
        setOccupancyData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching occupancy data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, [facilityId]);

  if (loading) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">Loading occupancy data...</p>
      </div>
    );
  }

  if (error || !occupancyData) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-red-700">Unable to load occupancy data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Weekly Occupancy</h3>
      
      <div className="grid grid-cols-1 gap-2">
        {occupancyData.occupancyData?.map((day, index) => {
          const isExpanded = expandedDay === index;
          const occupancyPercent = Math.round(day.occupancyPercent || 0);
          
          // Color coding & status based on occupancy percentage
          let colorClass = 'bg-green-50 border-green-200';
          let barColor = 'bg-green-500';
          let statusText = '100% Available';
          
          if (occupancyPercent > 80) {
            colorClass = 'bg-red-50 border-red-200';
            barColor = 'bg-red-500';
            statusText = 'Full - ' + occupancyPercent + '% Booked';
          } else if (occupancyPercent > 50) {
            colorClass = 'bg-yellow-50 border-yellow-200';
            barColor = 'bg-yellow-500';
            statusText = occupancyPercent + '% Booked';
          } else if (occupancyPercent > 0) {
            colorClass = 'bg-blue-50 border-blue-200';
            barColor = 'bg-blue-500';
            statusText = occupancyPercent + '% Booked';
          }

          return (
            <div key={index} className={`${colorClass} border rounded-lg p-3 cursor-pointer transition-all`}
              onClick={() => setExpandedDay(isExpanded ? null : index)}>
              
              {/* Day Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{day.dayName}</p>
                  <p className="text-xs text-slate-600">{day.totalAttendees} expected attendees</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{occupancyPercent}%</p>
                  <p className="text-xs text-slate-600">{statusText}</p>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                <div
                  className={`${barColor} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                />
              </div>

              {/* User Details (Expandable) */}
              {isExpanded && day.bookings?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Bookings ({day.bookings.length}):</p>
                  <div className="space-y-2">
                    {day.bookings.map((booking, idx) => (
                      <div key={idx} className="bg-white rounded p-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{booking.userName}</p>
                            <p className="text-slate-600 truncate">{booking.email}</p>
                          </div>
                          <span className="ml-2 bg-blue-100 text-blue-900 px-2 py-1 rounded font-semibold">
                            {booking.expectedAttendees}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show More Indicator */}
              {day.bookings?.length > 0 && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-600">
                    {isExpanded ? '▲ Hide' : '▼ Show'} {day.bookings.length} booking{day.bookings.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
