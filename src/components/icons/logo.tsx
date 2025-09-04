export const Logo = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex items-center gap-2" {...props}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M22 10.5c0-.83-1.34-1.5-3-1.5s-3 .67-3 1.5c0 .65.89 1.21 2.11 1.41L15 17H9l-3.11-5.09C7.11 11.71 8 11.15 8 10.5c0-.83-1.34-1.5-3-1.5S2 9.67 2 10.5c0 .65.89 1.21 2.11 1.41L12 22l7.89-10.09C21.11 11.71 22 11.15 22 10.5z" fill="currentColor"/>
        <path d="M12 2L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4.92969 4.92969L7.75811 7.75811" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M19.0703 4.92969L16.2419 7.75811" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <span className="font-semibold text-lg text-foreground">WingsView</span>
  </div>
);
