// Aurum Heist — input.js
// Keyboard and mouse, kept in one place so the game loop only ever asks this
// module what the player is doing. Works in a browser; in Node (the
// screenshot harness) it simply reports nothing pressed.

export class Input {
  constructor() {
    this.keys = new Set();
    this.clicks = [];
    this.mouse = { x: 0, y: 0 };
    this.anyKey = null;
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
        this.keys.add(e.key.toLowerCase());
        this.anyKey = e.key.toLowerCase();
      });
      window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.keys.clear());
    }
  }

  attachCanvas(canvas) {
    if (!canvas || !canvas.addEventListener) return;
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse = { x, y };
      this.clicks.push({ x, y });
    });
  }

  down(...names) {
    return names.some((n) => this.keys.has(n));
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('a', 'arrowleft')) x -= 1;
    if (this.down('d', 'arrowright')) x += 1;
    if (this.down('w', 'arrowup')) y -= 1;
    if (this.down('s', 'arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  consumeClick() {
    return this.clicks.shift() ?? null;
  }

  consumeKey(name) {
    if (this.anyKey === name) {
      this.anyKey = null;
      return true;
    }
    return false;
  }

  clearTransient() {
    this.anyKey = null;
  }
}
