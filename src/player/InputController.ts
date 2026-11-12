/**
 * ECHO – THE WORLD REMEMBERS
 * Unified Input Controller: Keyboard, Mouse, Touch Joystick & Gamepad
 */

import * as THREE from 'three';

export class InputController {
  // Movement vector: x (-1 = left, 1 = right), y (-1 = back, 1 = forward)
  public moveInput = new THREE.Vector2();
  public isSprinting = false;
  public jumpJustPressed = false;
  public interactJustPressed = false;
  public pauseJustPressed = false;
  public questJustPressed = false;
  public viewToggleJustPressed = false;

  // Combat Inputs
  public attackJustPressed = false;
  public dodgeJustPressed = false;
  public pulseJustPressed = false;
  public sprintToggleJustPressed = false;

  // External touch virtual stick contribution
  public touchMoveInput = new THREE.Vector2();
  public touchSprinting = false;
  public touchButtonSprinting = false;
  public touchJoystickSprinting = false;

  // Camera deltas
  public cameraDeltaX = 0;
  public cameraDeltaY = 0;
  public zoomDelta = 0;

  // Internal key states
  private keysHeld = new Set<string>();
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Touch tracking for right-screen camera swipe
  private cameraTouchId: number | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;

  constructor(private container: HTMLElement) {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouchCamera();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keysHeld.add(e.code);

      if (e.code === 'Space') {
        this.jumpJustPressed = true;
        e.preventDefault();
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        this.interactJustPressed = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pauseJustPressed = true;
      }
      if (e.code === 'KeyQ' || e.code === 'KeyJ') {
        this.questJustPressed = true;
      }
      if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V' || e.key === 'ر') {
        this.viewToggleJustPressed = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.sprintToggleJustPressed = true;
      }

      // Combat key bindings (F = Attack, C / Alt = Dodge, R / X = Echo Pulse)
      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F' || e.key === 'ب') {
        this.attackJustPressed = true;
      }
      if (e.code === 'KeyC' || e.code === 'AltLeft' || e.key === 'c' || e.key === 'C' || e.key === 'ؤ') {
        this.dodgeJustPressed = true;
      }
      if (e.code === 'KeyR' || e.code === 'KeyX' || e.key === 'r' || e.key === 'R' || e.key === 'ق') {
        this.pulseJustPressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.isPointerDown = false;
    });
  }

  // Active joystick touch identifier for absolute separation of inputs
  public activeJoystickTouchId: number | null = null;

  public setJoystickTouchId(id: number | null): void {
    this.activeJoystickTouchId = id;
    if (id !== null && this.cameraTouchId === id) {
      this.cameraTouchId = null;
    }
  }

  private setupMouse(): void {
    this.container.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      // Don't drag camera if clicked on interactive UI element, joystick, or mobile control
      if (
        target.closest('.interactive') ||
        target.closest('#virtual-joystick-container') ||
        target.closest('#joystick-base') ||
        target.closest('#joystick-knob') ||
        target.closest('.customizable-control')
      ) {
        return;
      }

      if (e.button === 0 || e.button === 2) {
        this.isPointerDown = true;
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.cameraDeltaX += dx;
      this.cameraDeltaY += dy;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isPointerDown) {
        const dragDist = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);
        if (dragDist < 6) {
          if (e.button === 0) {
            this.attackJustPressed = true;
          } else if (e.button === 2) {
            this.pulseJustPressed = true;
          }
        }
      }
      this.isPointerDown = false;
    });

    this.container.addEventListener('wheel', (e) => {
      this.zoomDelta += e.deltaY;
    }, { passive: true });

    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupTouchCamera(): void {
    const isInteractiveTouch = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      return Boolean(
        el.closest('.interactive') ||
        el.closest('#virtual-joystick-container') ||
        el.closest('#joystick-base') ||
        el.closest('#joystick-knob') ||
        el.closest('.mobile-controls') ||
        el.closest('.quest-cluster') ||
        el.closest('.hud-actions') ||
        el.closest('.customizable-control') ||
        el.closest('.minimap-box') ||
        el.closest('#hud-layout-editor-overlay')
      );
    };

    this.container.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = touch.target as HTMLElement;

        // 1. Strict separation: Ignore any touch assigned to the virtual analog joystick
        if (this.activeJoystickTouchId !== null && touch.identifier === this.activeJoystickTouchId) {
          continue;
        }

        // 2. Strict separation: Left-side of screen (44% width) is strictly reserved for character movement / joystick
        // Touch camera rotation can ONLY be initiated from the dedicated camera control zone (right side of screen)
        if (touch.clientX < window.innerWidth * 0.44) {
          continue;
        }

        // 3. Ignore touches on interactive HUD elements & combat action buttons
        if (isInteractiveTouch(target)) {
          continue;
        }

        // Start dedicated camera rotation swipe
        if (this.cameraTouchId === null) {
          this.cameraTouchId = touch.identifier;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Never let the joystick touch affect camera rotation
        if (touch.identifier === this.activeJoystickTouchId) {
          if (this.cameraTouchId === touch.identifier) {
            this.cameraTouchId = null;
          }
          continue;
        }

        if (touch.identifier === this.cameraTouchId) {
          const dx = touch.clientX - this.lastTouchX;
          const dy = touch.clientY - this.lastTouchY;

          // Safe delta clamping to prevent any erratic jumps
          const clampedDx = Math.max(-120, Math.min(120, dx));
          const clampedDy = Math.max(-120, Math.min(120, dy));

          this.cameraDeltaX += clampedDx * 1.25;
          this.cameraDeltaY += clampedDy * 1.25;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  public update(): void {
    // 1. Process keyboard movement
    let x = 0;
    let y = 0;

    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) y += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) y -= 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) x -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) x += 1;

    let sprint =
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight') ||
      this.touchButtonSprinting ||
      this.touchJoystickSprinting ||
      this.touchSprinting;

    // 2. Add touch joystick contribution if active
    if (this.touchMoveInput.lengthSq() > 0.001) {
      x += this.touchMoveInput.x;
      y += this.touchMoveInput.y;
    }

    // 3. Add Gamepad contribution
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp) {
      const deadzone = 0.15;
      const gx = gp.axes[0];
      const gy = gp.axes[1];
      if (Math.abs(gx) > deadzone) x += gx;
      if (Math.abs(gy) > deadzone) y -= gy;

      const camX = gp.axes[2];
      const camY = gp.axes[3];
      if (Math.abs(camX) > deadzone) this.cameraDeltaX += camX * 8;
      if (Math.abs(camY) > deadzone) this.cameraDeltaY += camY * 8;

      if (gp.buttons[0]?.pressed) this.jumpJustPressed = true;
      if (gp.buttons[2]?.pressed) this.interactJustPressed = true;
      if (gp.buttons[10]?.pressed || gp.buttons[7]?.pressed) sprint = true;
      if (gp.buttons[9]?.pressed) this.pauseJustPressed = true;
    }

    // Normalize diagonal movement
    this.moveInput.set(x, y);
    if (this.moveInput.lengthSq() > 1.0) {
      this.moveInput.normalize();
    }

    // Sprint state active whenever sprint button or Shift is pressed (enables running in place when standing still)
    this.isSprinting = sprint;
  }

  public clearFrameDeltas(): void {
    this.cameraDeltaX = 0;
    this.cameraDeltaY = 0;
    this.zoomDelta = 0;
    this.jumpJustPressed = false;
    this.interactJustPressed = false;
    this.pauseJustPressed = false;
    this.questJustPressed = false;
    this.viewToggleJustPressed = false;
    this.attackJustPressed = false;
    this.dodgeJustPressed = false;
    this.pulseJustPressed = false;
    this.sprintToggleJustPressed = false;
  }
}
