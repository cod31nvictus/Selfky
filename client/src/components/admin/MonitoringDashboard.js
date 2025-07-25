import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './MonitoringDashboard.css';

const MonitoringDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getMonitoringDashboard();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch monitoring data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (healthy) => {
    return healthy ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = (status) => {
    return status ? '🟢' : '🔴';
  };

  if (loading) {
    return (
      <div className="monitoring-dashboard">
        <div className="loading">Loading monitoring data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monitoring-dashboard">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h2>Application Monitoring</h2>
        <div className="refresh-button" onClick={fetchDashboardData}>
          🔄 Refresh
        </div>
      </div>

      {/* Health Status Overview */}
      <div className="health-overview">
        <div className="health-card">
          <div className="health-indicator" style={{ backgroundColor: getHealthStatusColor(dashboardData.health.healthy) }}>
            {dashboardData.health.healthy ? 'Healthy' : 'Unhealthy'}
          </div>
          <div className="health-details">
            <p>Error Rate: {dashboardData.health.errorRate}</p>
            <p>Memory: {dashboardData.health.memoryUsage}</p>
            <p>Redis: {getStatusIcon(dashboardData.health.redisConnected)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Requests</h3>
                <div className="metric-value">{dashboardData.summary.totalRequests}</div>
                <div className="metric-label">Total</div>
              </div>
              <div className="metric-card">
                <h3>Success Rate</h3>
                <div className="metric-value">{dashboardData.summary.successRate}%</div>
                <div className="metric-label">Successful</div>
              </div>
              <div className="metric-card">
                <h3>Response Time</h3>
                <div className="metric-value">{dashboardData.summary.averageResponseTime}ms</div>
                <div className="metric-label">Average</div>
              </div>
              <div className="metric-card">
                <h3>Uptime</h3>
                <div className="metric-value">{dashboardData.summary.uptime}m</div>
                <div className="metric-label">Minutes</div>
              </div>
              <div className="metric-card">
                <h3>Live Users</h3>
                <div className="metric-value">{dashboardData.summary.activeUsers}</div>
                <div className="metric-label">Active</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-tab">
            <div className="performance-metrics">
              <h3>Performance Metrics</h3>
              <div className="metric-row">
                <span>Average Response Time:</span>
                <span>{dashboardData.summary.averageResponseTime}ms</span>
              </div>
              <div className="metric-row">
                <span>Error Rate:</span>
                <span>{dashboardData.summary.errorRate}%</span>
              </div>
              <div className="metric-row">
                <span>Success Rate:</span>
                <span>{dashboardData.summary.successRate}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="system-tab">
            <div className="system-metrics">
              <h3>System Resources</h3>
              <div className="metric-row">
                <span>Memory Usage:</span>
                <span>{dashboardData.system.memory.heapUsed}MB</span>
              </div>
              <div className="metric-row">
                <span>Total Memory:</span>
                <span>{dashboardData.system.memory.heapTotal}MB</span>
              </div>
              <div className="metric-row">
                <span>Redis Status:</span>
                <span>{getStatusIcon(dashboardData.system.redis)} {dashboardData.system.redis ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="metric-row">
                <span>Database Status:</span>
                <span>{getStatusIcon(dashboardData.system.database)} {dashboardData.system.database ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-tab">
            <h3>Active Alerts</h3>
            {dashboardData.alerts.length === 0 ? (
              <div className="no-alerts">No active alerts</div>
            ) : (
              <div className="alerts-list">
                {dashboardData.alerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${alert.type}`}>
                    <span className="alert-icon">
                      {alert.type === 'error' ? '🔴' : '🟡'}
                    </span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard; 