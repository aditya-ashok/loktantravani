export default function PostLoading() {
  return (
    <div className="max-w-7xl mx-auto px-8 md:px-16 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-3 w-48 bg-black/5 mb-8" />

      {/* Meta */}
      <div className="flex gap-4 mb-6">
        <div className="h-6 w-24 bg-primary/20" />
        <div className="h-6 w-20 bg-black/5" />
        <div className="h-6 w-24 bg-black/5" />
      </div>

      {/* Title */}
      <div className="space-y-4 mb-8">
        <div className="h-16 w-full bg-black/10" />
        <div className="h-16 w-3/4 bg-black/10" />
      </div>

      {/* Summary */}
      <div className="h-6 w-2/3 bg-black/5 mb-8" />

      {/* Author */}
      <div className="flex items-center gap-4 pb-8 border-b-4 border-double border-black/10 mb-12">
        <div className="w-12 h-12 bg-primary/20" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-black/10" />
          <div className="h-3 w-24 bg-black/5" />
        </div>
      </div>

      {/* Hero Image */}
      <div className="aspect-[16/9] bg-black/5 mb-12" />

      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 bg-black/5" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
