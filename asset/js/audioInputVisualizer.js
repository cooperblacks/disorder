// /assets/js/audioInputVisualizer.js
export function setupAudioVisualizer(stream, canvas) {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);

  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const ctx = canvas.getContext('2d');
  const radiusBase = 20;
  const draw = () => {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    const amplitude = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const scale = Math.min(Math.max(amplitude / 10, 1), 3);

    const center = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(center, center, radiusBase * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  draw();
}
