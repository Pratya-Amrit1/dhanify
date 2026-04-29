export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex justify-center items-center min-h-screen w-full overflow-hidden">
      {/* Circular gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-primary/40 to-primary/10 blur-3xl z-0" />

      {/* Clerk SignIn */}
      <div className="relative z-10 w-full max-w-md flex justify-center">
        {children}
      </div>
    </section>
  );
}
