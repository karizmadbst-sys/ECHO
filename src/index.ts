/**
 * ECHO – THE WORLD REMEMBERS
 * Main Application Entry Point
 * Robust lifecycle check ensuring initialization on both immediate and deferred loading
 */

import { Game } from './Game.ts';

function start(): void {
  const container = document.getElementById('root') || document.body;
  try {
    new Game(container);
  } catch (error) {
    console.error('Error starting ECHO Game:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  // Already interactive or complete
  start();
}
