export function CelebrationCheck() {
  return (
    <div className="w-48 h-48 flex items-center justify-center">
        <svg className="celebration-check w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="celebration-check-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="celebration-check-mark" fill="none" stroke="hsl(var(--accent-foreground))" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
    </div>
  );
}
