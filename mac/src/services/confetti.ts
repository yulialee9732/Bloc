import confetti from 'canvas-confetti';

export function burstAtPosition(
  x: number,
  y: number,
  colors: string[],
  windowWidth: number,
  windowHeight: number
): void {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x: x / windowWidth, y: y / windowHeight },
    colors,
    startVelocity: 30,
    ticks: 60,
    gravity: 0.8,
    scalar: 0.9,
  });
}

export function fullscreenFanfare(colors: string[]): void {
  const count = 200;
  const origins = [
    { x: 0.2, y: 0.4 },
    { x: 0.5, y: 0.3 },
    { x: 0.8, y: 0.4 },
  ];

  let fired = 0;
  function fire(origin: { x: number; y: number }) {
    confetti({
      particleCount: Math.round(count / origins.length),
      spread: 80,
      origin,
      colors,
      startVelocity: 45,
      ticks: 100,
      gravity: 0.7,
      scalar: 1.1,
    });
  }

  origins.forEach((o, i) => {
    setTimeout(() => fire(o), i * 150);
  });

  setTimeout(() => {
    origins.forEach((o, i) => {
      setTimeout(() => fire(o), i * 100);
    });
  }, 600);
}

export function stopConfetti(): void {
  confetti.reset();
}
