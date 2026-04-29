import AccountCardSkeleton from "./AccountCardSkeleton";

export default function AccountsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  );
}
