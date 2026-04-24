import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getWeeklyOccupancy } from '../services/facilityService';

export default function OccupancyChart({ facilityId }) {
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [period, setPeriod] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOccupancy = async () => {
    if (!facilityId) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchOccupancy();
  }, [facilityId, period]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOccupancy();
    setIsRefreshing(false);
  };

  const formatBookingTime = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
      const startHour = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const endHour = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${startHour} - ${endHour}`;
    } catch (e) {
      return '';
    }
  };

  const getActualBookingStatus = (status, endTime) => {
    if (endTime) {
      const endDateTime = new Date(endTime);
      const now = new Date();
      if (now > endDateTime && status?.toUpperCase() === 'BOOKED') {
        return 'COMPLETED';
      }
    }
    return status;
  };

  const calculateCompletedPercent = (day) => {
    if (!day.bookings || day.bookings.length === 0) return 0;
    const now = new Date();
    const completedBookings = day.bookings.filter(booking => {
      const endTime = new Date(booking.endTime);
      return now > endTime && !isNaN(endTime.getTime());
    }).length;
    return (completedBookings / day.bookings.length) * day.occupancyPercent;
  };

  if (loading && !occupancyData) {
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
    <div className="space-y-4">
      {/* Chart Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Weekly Occupancy</h3>
        
        <div className="flex gap-2 items-center">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh occupancy data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {occupancyData.occupancyData?.map((day, index) => {
          const isExpanded = expandedDay === index;
          const occupancyPercent = Math.round(day.occupancyPercent || 0);
          const completedPercent = Math.round(calculateCompletedPercent(day));
          const availablePercent = 100 - occupancyPercent;
          
          // Color coding & status based on occupancy percentage
          let colorClass = 'bg-green-50 border-green-200';
          let statusText = 'Available';
          
          if (occupancyPercent > 80) {
            colorClass = 'bg-red-50 border-red-200';
            statusText = 'Full - ' + occupancyPercent + '% Booked';
          } else if (occupancyPercent > 50) {
            colorClass = 'bg-yellow-50 border-yellow-200';
            statusText = occupancyPercent + '% Booked';
          } else if (occupancyPercent > 0) {
            colorClass = 'bg-blue-50 border-blue-200';
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
                  <p className="text-sm font-semibold text-slate-700">{statusText}</p>
                </div>
              </div>

              {/* Occupancy Bar - Shows Completed and Available */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 flex overflow-hidden">
                {completedPercent > 0 && (
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(completedPercent, 100)}%` }}
                    title="Completed"
                  />
                )}
                {occupancyPercent - completedPercent > 0 && (
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(occupancyPercent - completedPercent, 100 - completedPercent)}%` }}
                    title="Booked"
                  />
                )}
                {availablePercent > 0 && (
                  <div
                    className="bg-gray-300 h-3 flex-1"
                    title="Available"
                  />
                )}
              </div>

              {/* Bar Legend */}
              <div className="flex justify-between text-xs text-slate-600 mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Completed {completedPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Booked {occupancyPercent - completedPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  Available {availablePercent}%
                </span>
              </div>

              {/* User Details (Expandable) */}
              {isExpanded && day.bookings?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Bookings ({day.bookings.length}):</p>
                  <div className="space-y-2">
                    {day.bookings.map((booking, idx) => {
                      const actualStatus = getActualBookingStatus(booking.status, booking.endTime);
                      const bookingTime = formatBookingTime(booking.startTime, booking.endTime);
                      const statusColor = actualStatus === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800';
                      
                      return (
                        <div key={idx} className="bg-white rounded p-2 text-xs">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{booking.userName}</p>
                              <p className="text-slate-600 text-xs truncate">{booking.email}</p>
                              {bookingTime && (
                                <p className="text-slate-500 text-xs mt-1">
                                  <span className="font-medium">Time:</span> {bookingTime}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 items-center ml-2">
                              <span className={`px-2 py-1 rounded font-semibold ${statusColor}`}>
                                {actualStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
