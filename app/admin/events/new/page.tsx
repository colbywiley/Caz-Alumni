import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-3xl">New event</h1>
      <p className="mt-2 text-[var(--color-caz-muted)]">Create an alumni event. Only admins can create or edit events.</p>
      <div className="mt-6">
        <EventForm />
      </div>
    </div>
  );
}
