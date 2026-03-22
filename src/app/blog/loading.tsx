export default function BlogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-8 md:px-16">
      {/* Masthead skeleton */}
      <div className="text-center mb-8 pb-8 border-b-4 border-double border-black/10 animate-pulse">
        <div className="h-4 w-64 bg-black/5 mx-auto mb-4" />
        <div className="h-12 w-96 bg-black/10 mx-auto mb-2" />
        <div className="h-4 w-80 bg-black/5 mx-auto" />
      </div>

      {/* Category filters skeleton */}
      <div className="flex gap-2 mb-12 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-black/5 border border-black/5" />
        ))}
      </div>

      {/* Featured post skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 animate-pulse">
        <div className="aspect-[16/9] bg-black/5" />
        <div className="space-y-4 py-4">
          <div className="h-4 w-24 bg-primary/20" />
          <div className="h-10 w-full bg-black/10" />
          <div className="h-10 w-3/4 bg-black/10" />
          <div className="h-4 w-48 bg-black/5" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="aspect-[3/2] bg-black/5" />
            <div className="h-3 w-20 bg-primary/20" />
            <div className="h-6 w-full bg-black/10" />
            <div className="h-6 w-2/3 bg-black/10" />
            <div className="h-3 w-32 bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
