export default function LabelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-6 md:-m-8 flex min-h-[calc(100vh-5.5rem)] flex-col">
      {children}
    </div>
  );
}
