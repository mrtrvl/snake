const fs = require('fs');
const { exec } = require('child_process');
const AudioContext = require('web-audio-api').AudioContext;
const audioCtx = new AudioContext();

function generateTone(frequency, duration) {
  const sampleRate = 44100;
  const samples = duration * sampleRate;
  const buffer = audioCtx.createBuffer(1, samples, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < samples; i++) {
    channel[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }

  return buffer;
}

// Generate eat sound (high beep)
const eatBuffer = generateTone(880, 0.1);
fs.writeFileSync('eat.wav', eatBuffer);

// Generate special sound (higher beep)
const specialBuffer = generateTone(1760, 0.2);
fs.writeFileSync('special.wav', specialBuffer);

// Generate game over sound (low beep)
const gameOverBuffer = generateTone(440, 0.3);
fs.writeFileSync('gameover.wav', gameOverBuffer);

// Generate start sound (medium beep)
const startBuffer = generateTone(1175, 0.2);
fs.writeFileSync('start.wav', startBuffer);