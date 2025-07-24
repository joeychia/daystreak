export function CelebrationCheck() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="celebration-check w-24 h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="celebration-check-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="celebration-check-mark" fill="none" stroke="hsl(var(--accent-foreground))" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
    </div>
  );
}
