interface FeedThePageProps {
  onOpenEventForm: () => void;
  onOpenOpeningForm: () => void;
}

export function FeedThePage({ onOpenEventForm, onOpenOpeningForm }: FeedThePageProps) {
  return (
    <div className="border-t-4 border-events/100 pt-8 pb-4">
      <h2 className="font-signature font-black uppercase text-3xl md:text-4xl tracking-tight text-[#f5f1e8]">
        The first ask
      </h2>
      <p className="font-disrupt italic text-[#f5f1e8]/70 mt-2 max-w-[58ch]">
        this page is fed by the people who use it. ten minutes, from a sofa, on a phone — and your name goes on
        the listing.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={onOpenEventForm}
          className="appearance-none block sm:inline-block w-full sm:w-auto mb-4 sm:mb-0 sm:mr-4 bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight px-6 py-3 rounded-sharp hover:bg-events/90 transition-colors"
        >
          Add a gathering
        </button>
        <button
          type="button"
          onClick={onOpenOpeningForm}
          className="appearance-none block sm:inline-block w-full sm:w-auto bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight px-6 py-3 rounded-sharp hover:bg-events/90 transition-colors"
        >
          Add an opening
        </button>
      </div>

      <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-4">
        your name goes on the listing — "found by" is the credit.
      </p>
    </div>
  );
}
