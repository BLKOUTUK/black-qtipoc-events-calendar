import { useState } from 'react';
import { X } from 'lucide-react';
import { OpeningBeat, OpeningKind } from '../types/surface';

interface OpeningFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const KIND_OPTIONS: { value: OpeningKind; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'commission', label: 'Commission' },
  { value: 'residency', label: 'Residency' },
  { value: 'bursary', label: 'Bursary' },
  { value: 'fund', label: 'Fund' },
  { value: 'call', label: 'Call' },
  { value: 'panel', label: 'Panel' },
  { value: 'training', label: 'Training' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

const BEAT_OPTIONS: { value: OpeningBeat; label: string }[] = [
  { value: 'arts-film', label: 'Arts & film' },
  { value: 'writing-publishing', label: 'Writing & publishing' },
  { value: 'jobs-training', label: 'Jobs & training' },
  { value: 'money', label: 'Money' },
  { value: 'study-research', label: 'Study & research' },
  { value: 'community-organising', label: 'Community & organising' },
];

const inputClass =
  'w-full bg-[#0a0a14] border border-events/30 rounded-sharp px-3 py-2 text-[#f5f1e8] placeholder:text-[#f5f1e8]/30 focus:outline-none focus:border-events/100';
const labelClass = 'font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/70 mb-1 block';

export function OpeningForm({ onSubmit, onCancel }: OpeningFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    organisation: '',
    url: '',
    deadline: '',
    rolling: false,
    kind: 'other' as OpeningKind,
    beat: 'community-organising' as OpeningBeat,
    summary: '',
    open_to: '',
    pay: '',
    location: '',
    found_by: '',
    found_by_contact: '',
    website: '', // honeypot
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.title.trim()) next.title = 'Title is required';
    if (!formData.organisation.trim()) next.organisation = 'Organisation is required';
    if (!/^https?:\/\//i.test(formData.url.trim())) next.url = 'Link must start with http:// or https://';
    if (!formData.rolling && !formData.deadline) next.deadline = 'Add a closing date, or tick rolling';
    if (!formData.summary.trim()) next.summary = 'A line on what it is is required';
    if (formData.summary.length > 280) next.summary = 'Keep it to 280 characters or fewer';
    if (!formData.found_by.trim()) next.found_by = 'Your name is required — it goes on the listing';
    if (!formData.found_by_contact.trim()) next.found_by_contact = 'We need a way to reach you';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot: a filled-in "website" field means a bot filled the form. Pretend success,
    // don't hit the API, don't tip the bot off.
    if (formData.website.trim()) {
      setSuccess(true);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit-opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          organisation: formData.organisation.trim(),
          url: formData.url.trim(),
          deadline: formData.rolling ? null : formData.deadline || null,
          rolling: formData.rolling,
          kind: formData.kind,
          beat: formData.beat,
          summary: formData.summary.trim(),
          open_to: formData.open_to.trim() || null,
          pay: formData.pay.trim() || null,
          location: formData.location.trim() || null,
          found_by: formData.found_by.trim(),
          found_by_contact: formData.found_by_contact.trim(),
          website: formData.website,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Something went wrong (${res.status}). Please try again.`);
      }

      setSuccess(true);
      onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#14141f] border-4 border-events/100 rounded-sharp max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-signature font-black uppercase text-2xl text-[#f5f1e8]">Add an opening</h2>
            <button
              onClick={onCancel}
              className="text-[#f5f1e8]/60 hover:text-events/100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div>
              <p className="text-[#f5f1e8]">
                Thanks — a person will look at it before it goes up, usually within a week. Your name goes on
                the listing.
              </p>
              <button
                onClick={onCancel}
                className="mt-6 bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight px-6 py-3 rounded-sharp hover:bg-events/90 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="border border-red-500/50 bg-red-500/10 rounded-sharp px-3 py-2 text-red-300 text-sm">
                  {submitError}
                </div>
              )}

              {/* Honeypot — hidden from real people */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="title" className={labelClass}>
                  Title *
                </label>
                <input id="title" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="organisation" className={labelClass}>
                  Organisation *
                </label>
                <input
                  id="organisation"
                  name="organisation"
                  value={formData.organisation}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.organisation && <p className="text-red-400 text-sm mt-1">{errors.organisation}</p>}
              </div>

              <div>
                <label htmlFor="url" className={labelClass}>
                  Link *
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://…"
                  value={formData.url}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="deadline" className={labelClass}>
                    Closes
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    disabled={formData.rolling}
                    className={`${inputClass} disabled:opacity-40`}
                  />
                </div>
                <label htmlFor="rolling" className="flex items-center gap-2 text-sm text-[#f5f1e8]/70 pb-2">
                  <input
                    id="rolling"
                    name="rolling"
                    type="checkbox"
                    checked={formData.rolling}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  Rolling — no deadline
                </label>
              </div>
              {errors.deadline && <p className="text-red-400 text-sm -mt-2">{errors.deadline}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="kind" className={labelClass}>
                    Kind
                  </label>
                  <select id="kind" name="kind" value={formData.kind} onChange={handleChange} className={inputClass}>
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="beat" className={labelClass}>
                    Beat
                  </label>
                  <select id="beat" name="beat" value={formData.beat} onChange={handleChange} className={inputClass}>
                    {BEAT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="summary" className={labelClass}>
                  One line on what it is * (≤280 characters)
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  maxLength={280}
                  value={formData.summary}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.summary && <p className="text-red-400 text-sm mt-1">{errors.summary}</p>}
              </div>

              <div>
                <label htmlFor="open_to" className={labelClass}>
                  Who it's open to
                </label>
                <input id="open_to" name="open_to" value={formData.open_to} onChange={handleChange} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pay" className={labelClass}>
                    Pay or fee
                  </label>
                  <input id="pay" name="pay" value={formData.pay} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="location" className={labelClass}>
                    Location
                  </label>
                  <input id="location" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="found_by" className={labelClass}>
                  Your name (goes on the listing) *
                </label>
                <input
                  id="found_by"
                  name="found_by"
                  value={formData.found_by}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.found_by && <p className="text-red-400 text-sm mt-1">{errors.found_by}</p>}
              </div>

              <div>
                <label htmlFor="found_by_contact" className={labelClass}>
                  How to reach you (email, never shown) *
                </label>
                <input
                  id="found_by_contact"
                  name="found_by_contact"
                  type="email"
                  value={formData.found_by_contact}
                  onChange={handleChange}
                  className={inputClass}
                />
                {errors.found_by_contact && <p className="text-red-400 text-sm mt-1">{errors.found_by_contact}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[#f5f1e8]/70 hover:text-[#f5f1e8] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight px-6 py-2 rounded-sharp hover:bg-events/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
