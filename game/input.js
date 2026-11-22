export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastClick = null;
    
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onKeyDown(e) {
    this.keys.add(e.code);
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this.keys.add('Enter');
    }
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this.keys.delete('Enter');
    }
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.mouseDown = true;
      this.lastClick = { x: e.clientX, y: e.clientY };
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  }

  onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  getMovement() {
    return {
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
      up: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      crouch: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      enter: this.keys.has('Enter'),
      click: this.lastClick
    };
  }

  consumeClick() {
    const click = this.lastClick;
    this.lastClick = null;
    return click;
  }

  isKeyDown(code) {
    return this.keys.has(code);
  }
}

export const input = new Input();
