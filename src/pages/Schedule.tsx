import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import CreateEventModal from '@/components/CreateEventModal';
import CreateGroupSessionModal from '@/components/CreateGroupSessionModal';
import EventDetailsModal from '@/components/EventDetailsModal';
import { Button } from '@/components/ui/button';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, List, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'sonner';
import './schedule.css';

const DnDCalendar = withDragAndDrop(Calendar);

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Schedule = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('month');
    const [showList, setShowList] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sessionsRes, calendarRes] = await Promise.all([
                client.get('/sessions'), // Already filtered by backend for psychologist
                client.get('/calendar')
            ]);

            // Backend already filters by psychologist ID
            const mySessions = Array.isArray(sessionsRes.data.data)
                ? sessionsRes.data.data
                : Array.isArray(sessionsRes.data)
                    ? sessionsRes.data
                    : [];
            setSessions(mySessions);

            const myEvents = Array.isArray(calendarRes.data.data)
                ? calendarRes.data.data
                : Array.isArray(calendarRes.data)
                    ? calendarRes.data
                    : [];

            // Convert sessions to calendar events with better titles
            const sessionEvents = mySessions.map((session: any) => {
                const patientName = session.patient?.alias || 'Available Slot';
                const sessionType = session.type || 'Session';
                const statusIcon = session.status === 'COMPLETED' ? '✓' :
                    session.status === 'CANCELLED' ? '✗' :
                        session.status === 'LIVE' ? '●' : '';

                return {
                    id: session.id,
                    title: `${statusIcon} ${patientName} - ${sessionType}`,
                    start: new Date(session.startTime),
                    end: new Date(session.endTime),
                    resource: { ...session, isSession: true },
                };
            });

            // Convert custom events
            const customCalendarEvents = myEvents.map((evt: any) => ({
                id: evt.id,
                title: evt.title,
                start: new Date(evt.startTime),
                end: new Date(evt.endTime),
                resource: { ...evt, isSession: false },
            }));

            setEvents([...sessionEvents, ...customCalendarEvents]);
        } catch (error) {
            console.error('Failed to load schedule:', error);
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };



    const updateEvent = async (eventId: string, start: Date, end: Date) => {
        try {
            await client.patch(`/calendar/${eventId}`, {
                startTime: start.toISOString(),
                endTime: end.toISOString(),
            });
            toast.success('Event updated');
            loadData();
        } catch (error) {
            console.error('Failed to update event:', error);
            toast.error('Failed to update event');
        }
    };

    const onEventDrop = ({ event, start, end }: any) => {
        if (event.resource.isSession) {
            toast.error('Cannot reschedule sessions via drag and drop. Please ask the patient to reschedule.');
            return;
        }
        updateEvent(event.id, start, end);
    };

    const onEventResize = ({ event, start, end }: any) => {
        if (event.resource.isSession) {
            toast.error('Cannot resize sessions.');
            return;
        }
        updateEvent(event.id, start, end);
    };

    const eventStyleGetter = (event: any) => {
        const resource = event.resource;
        let backgroundColor = '#3b82f6'; // default blue

        if (resource.isSession) {
            if (resource.status === 'COMPLETED') backgroundColor = '#10b981'; // green
            if (resource.status === 'CANCELLED') backgroundColor = '#ef4444'; // red
            if (resource.status === 'LIVE') backgroundColor = '#f59e0b'; // orange
        } else {
            // Custom event types
            if (resource.type === 'BLOCKED') backgroundColor = '#6b7280'; // gray
            if (resource.type === 'PERSONAL') backgroundColor = '#8b5cf6'; // purple
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        };
    };

    const filteredSessions = sessions.filter(s => {
        if (filterStatus === 'ALL') return true;
        return s.status === filterStatus;
    });

    if (loading) return <div className="p-10 text-center text-textMuted">Loading schedule...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">My Schedule</h1>
                    <p className="text-textMuted mt-1">Manage your therapy sessions and personal events</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Event
                    </Button>
                    {user?.role === 'PSYCHOLOGIST' && (
                        <Button variant="secondary" onClick={() => setIsCreateGroupModalOpen(true)}>
                            <Users size={16} className="mr-2" />
                            Group Session
                        </Button>
                    )}
                    <Button
                        variant={showList ? 'default' : 'outline'}
                        onClick={() => setShowList(!showList)}
                    >
                        {showList ? <CalendarIcon size={16} className="mr-2" /> : <List size={16} className="mr-2" />}
                        {showList ? 'Calendar View' : 'List View'}
                    </Button>
                </div>
            </div>

            {showList ? (
                /* List View */
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-2">
                        {['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-textMuted hover:bg-background'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Session List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredSessions.length === 0 ? (
                            <div className="col-span-2 bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                                <Clock className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                                <p className="text-textMuted">No sessions found</p>
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="bg-surface rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedEvent({
                                        id: session.id,
                                        title: `${session.patient?.alias || 'Available'} - ${session.type}`,
                                        start: new Date(session.startTime),
                                        end: new Date(session.endTime),
                                        resource: { ...session, isSession: true }
                                    })}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-text">
                                                {session.patient?.alias || 'Available Slot'}
                                            </p>
                                            <p className="text-sm text-textMuted mt-1">
                                                {new Date(session.startTime).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} at{' '}
                                                {new Date(session.startTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full font-medium ${session.status === 'COMPLETED'
                                                ? 'bg-green-500/10 text-green-600'
                                                : session.status === 'CANCELLED'
                                                    ? 'bg-red-500/10 text-red-600'
                                                    : session.status === 'LIVE'
                                                        ? 'bg-orange-500/10 text-orange-600'
                                                        : 'bg-blue-500/10 text-blue-600'
                                                }`}
                                        >
                                            {session.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-textMuted">Type:</span>{' '}
                                            <span className="font-medium text-text">{session.type || 'One-on-One'}</span>
                                        </div>
                                        <div>
                                            <span className="text-textMuted">Duration:</span>{' '}
                                            <span className="font-medium text-text">
                                                {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min
                                            </span>
                                        </div>
                                    </div>
                                    {session.price && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <span className="text-sm text-textMuted">Fee:</span>{' '}
                                            <span className="font-semibold text-green-600">${session.price}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                /* Calendar View */
                <div className="space-y-4">
                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <Button
                            variant={view === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('month')}
                        >
                            Month
                        </Button>
                        <Button
                            variant={view === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('week')}
                        >
                            Week
                        </Button>
                        <Button
                            variant={view === 'day' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('day')}
                        >
                            Day
                        </Button>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500"></div>
                            <span className="text-textMuted">Session</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500"></div>
                            <span className="text-textMuted">Live</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span className="text-textMuted">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-purple-500"></div>
                            <span className="text-textMuted">Personal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-500"></div>
                            <span className="text-textMuted">Blocked</span>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-surface rounded-xl border border-border p-6" style={{ height: '700px' }}>
                        <DnDCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor={(event: any) => new Date(event.start)}
                            endAccessor={(event: any) => new Date(event.end)}
                            view={view}
                            onView={setView}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={(event: any) => setSelectedEvent(event)}
                            onEventDrop={onEventDrop}
                            onEventResize={onEventResize}
                            resizable
                            popup
                            draggableAccessor={(event: any) => !event.resource.isSession} // Only allow dragging custom events
                        />
                    </div>
                </div>
            )}

            <CreateEventModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadData}
                selectedDate={new Date()}
            />

            <CreateGroupSessionModal
                open={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onSuccess={loadData}
                selectedDate={new Date()}
            />

            <EventDetailsModal
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />
        </div>
    );
};

export default Schedule;
