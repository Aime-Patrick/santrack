export default function LabelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-3 flex h-[calc(100%+1.5rem)] min-h-0 flex-col overflow-hidden md:-m-4 md:h-[calc(100%+2rem)]">
      {children}
    </div>
  );
}
