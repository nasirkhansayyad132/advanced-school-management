import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  Trash2
} from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
  getPendingEvents, 
  updateEventStatus, 
  removePendingEvent 
} from '../../services/offlineDb';
import { attendanceApi } from '../../services/api';
import type { PendingAttendanceEvent } from '../../types';

export default function SyncStatusPage() {
  const isOnline = useNetworkStatus();
  const [events, setEvents] = useState<PendingAttendanceEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load pending events
  const loadEvents = async () => {
    const pendingEvents = await getPendingEvents();
    setEvents(pendingEvents);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Sync all pending events
  const syncAll = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    const pendingEvents = events.filter(e => e.status === 'PENDING' || e.status === 'FAILED');

    for (const event of pendingEvents) {
      try {
        await updateEventStatus(event.idempotencyKey, 'SYNCING');
        await loadEvents();

        await attendanceApi.submit({
          idempotencyKey: event.idempotencyKey,
          classId: event.classId,
          date: event.date,
          session: event.session,
          records: event.records,
          clientCreatedAt: event.clientCreatedAt,
        });

        await updateEventStatus(event.idempotencyKey, 'SYNCED');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        await updateEventStatus(event.idempotencyKey, 'FAILED', errorMessage);
      }
    }

    setLastSyncTime(new Date());
    setIsSyncing(false);
    await loadEvents();
  };

  // Retry single event
  const retryEvent = async (idempotencyKey: string) => {
    if (!isOnline) return;
    
    const event = events.find(e => e.idempotencyKey === idempotencyKey);
    if (!event) return;

    try {
      await updateEventStatus(idempotencyKey, 'SYNCING');
      await loadEvents();

      await attendanceApi.submit({
        idempotencyKey: event.idempotencyKey,
        classId: event.classId,
        date: event.date,
        session: event.session,
        records: event.records,
        clientCreatedAt: event.clientCreatedAt,
      });

      await updateEventStatus(idempotencyKey, 'SYNCED');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      await updateEventStatus(idempotencyKey, 'FAILED', errorMessage);
    }

    await loadEvents();
  };

  // Delete synced event
  const deleteEvent = async (idempotencyKey: string) => {
    await removePendingEvent(idempotencyKey);
    await loadEvents();
  };

  const getStatusIcon = (status: PendingAttendanceEvent['status']) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'SYNCING':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: PendingAttendanceEvent['status']) => {
    switch (status) {
      case 'SYNCED':
        return 'Synced';
      case 'FAILED':
        return 'Failed';
      case 'SYNCING':
        return 'Syncing...';
      default:
        return 'Pending';
    }
  };

  const pendingCount = events.filter(e => e.status === 'PENDING' || e.status === 'FAILED').length;
  const syncedCount = events.filter(e => e.status === 'SYNCED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-gray-900">Sync Status</h1>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Network Status */}
        <div className={`card flex items-center gap-3 ${
          isOnline ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Connected</p>
                <p className="text-sm text-green-600">Ready to sync</p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Offline</p>
                <p className="text-sm text-yellow-600">Data saved locally</p>
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{syncedCount}</p>
            <p className="text-sm text-gray-500">Synced Today</p>
          </div>
        </div>

        {/* Last Sync */}
        {lastSyncTime && (
          <p className="text-sm text-gray-500 text-center">
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </p>
        )}

        {/* Sync All Button */}
        {pendingCount > 0 && (
          <button
            onClick={syncAll}
            disabled={!isOnline || isSyncing}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : `Sync All (${pendingCount})`}
          </button>
        )}

        {/* Event List */}
        <div className="space-y-2">
          <h2 className="font-medium text-gray-700">Recent Events</h2>
          
          {events.length === 0 ? (
            <div className="card text-center text-gray-500 py-8">
              <p>No attendance events</p>
              <p className="text-sm mt-1">Take attendance to see it here</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.idempotencyKey} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(event.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.classId.substring(0, 8)}... | {event.session}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium ${
                        event.status === 'SYNCED' ? 'text-green-600' :
                        event.status === 'FAILED' ? 'text-red-600' :
                        event.status === 'SYNCING' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {getStatusText(event.status)}
                      </p>
                      {event.lastError && (
                        <p className="text-xs text-red-500 mt-1">{event.lastError}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {(event.status === 'PENDING' || event.status === 'FAILED') && (
                      <button
                        onClick={() => retryEvent(event.idempotencyKey)}
                        disabled={!isOnline}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {event.status === 'SYNCED' && (
                      <button
                        onClick={() => deleteEvent(event.idempotencyKey)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
