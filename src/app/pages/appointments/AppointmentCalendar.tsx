// DEPRECATED — there is no more appointment booking to manage here. Events
// (including staff-organized/participated events and 1-on-1 trial classes)
// now show on the Unified Calendar (src/app/pages/calendar/UnifiedCalendar.tsx)
// and are managed in Event Management (src/app/pages/events/EventManagement.tsx).
// This page's route and nav entry have been removed. It is kept on disk only
// because this environment could not delete the file directly — safe to
// delete src/app/pages/appointments/AppointmentCalendar.tsx manually.
export default function AppointmentCalendar() {
  return null;
}
