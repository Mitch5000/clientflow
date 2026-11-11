export function confetti() {
  const colors = ['#ff3b3b', '#ffb020', '#2dd4bf', '#8b5cf6', '#f8fafc'];
  for (let i = 0; i < 26; i++) {
    const el = document.createElement('div');
    const size = 6 + Math.random() * 6;
    el.style.cssText =
      `position:fixed;z-index:120;pointer-events:none;width:${size}px;height:${size}px;` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'};background:${colors[i % colors.length]};` +
      `left:${50 + (Math.random() * 30 - 15)}vw;top:42vh;opacity:1;` +
      `transition:transform 1s cubic-bezier(.2,.6,.3,1),opacity 1s ease;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${(Math.random() * 2 - 1) * 240}px, ${-(60 + Math.random() * 180)}px) rotate(${Math.random() * 720 - 360}deg)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 1100);
  }
}
