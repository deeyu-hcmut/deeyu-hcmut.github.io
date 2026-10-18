// Logo cursor for mouse users: tilted like an arrow normally, upright and slightly larger over
// clickable elements, with a ripple on click. Text fields keep the native I-beam.
// Touch devices never start it, and if this script fails the native cursor is still there.

const SIZE = 32;
// Flame tip of public/cursor.png (64px source shown at 32px) is the click point.
const TIP_X = 16;
const TIP_Y = 1;

const CLICKABLE = 'a[href], button, [role="button"], [role="tab"], [role="menuitem"], label, select, summary, .cursor-pointer, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="file"]';
const TEXT = 'input, textarea, [contenteditable=""], [contenteditable="true"]';

export function initLogoCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const style = document.createElement('style');
  style.textContent = `
    html.logo-cursor, html.logo-cursor * { cursor: none !important; }
    html.logo-cursor :is(${TEXT}):not(:is(${CLICKABLE})) { cursor: text !important; }
    .logo-cursor-el {
      position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
      width: ${SIZE}px; height: ${SIZE}px; margin: -${TIP_Y}px 0 0 -${TIP_X}px;
      will-change: transform; opacity: 0; transition: opacity .15s;
    }
    .logo-cursor-el.visible { opacity: 1; }
    .logo-cursor-img {
      width: 100%; height: 100%; background: url("/cursor.png") center / contain no-repeat;
      transform-origin: ${TIP_X}px ${TIP_Y}px; transform: rotate(-35deg);
      transition: transform .25s cubic-bezier(.34, 1.56, .64, 1), filter .25s;
      filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .35));
    }
    .logo-cursor-el.hover .logo-cursor-img {
      transform: rotate(0deg) scale(1.2);
      filter: drop-shadow(0 0 6px rgb(129 140 248 / .9));
    }
    .logo-cursor-el.down .logo-cursor-img { transform: rotate(0deg) scale(.9); transition-duration: .08s; }
    .logo-cursor-ripple {
      position: fixed; z-index: 2147483646; pointer-events: none; width: 36px; height: 36px;
      margin: -18px 0 0 -18px; border-radius: 50%; border: 2px solid rgb(99 102 241);
      animation: logo-cursor-ripple .5s ease-out forwards;
    }
    @keyframes logo-cursor-ripple {
      from { transform: scale(.2); opacity: .9; }
      to { transform: scale(1.4); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .logo-cursor-img { transition: none; }
      .logo-cursor-ripple { display: none; }
    }
    @media print { .logo-cursor-el { display: none; } }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.className = 'logo-cursor-el';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="logo-cursor-img"></div>';
  document.body.appendChild(el);
  document.documentElement.classList.add('logo-cursor');

  let x = 0, y = 0, frame = 0;
  const render = () => {
    frame = 0;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  document.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!frame) frame = requestAnimationFrame(render);

    if (!(e.target instanceof Element)) return;
    const onClickable = e.target.closest(CLICKABLE);
    const inText = !onClickable && !!e.target.closest(TEXT);
    const clickable = !!onClickable && !onClickable.matches(':disabled');
    el.classList.toggle('visible', !inText);
    el.classList.toggle('hover', clickable);
  }, { passive: true });

  document.addEventListener('mousedown', (e) => {
    el.classList.add('down');
    const ripple = document.createElement('div');
    ripple.className = 'logo-cursor-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
    setTimeout(() => ripple.remove(), 600);
  });
  document.addEventListener('mouseup', () => el.classList.remove('down'));
  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('visible'));
}
