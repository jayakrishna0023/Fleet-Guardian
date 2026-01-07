/**
 * Audio Analyzer for real-time audio frequency data
 * Used for voice assistant visualizations
 */

export class AudioAnalyzer {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Uint8Array<ArrayBuffer>;
  private floatDataArray: Float32Array<ArrayBuffer>;

  constructor(audioContext: AudioContext, sourceNode?: AudioNode) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength) as Uint8Array<ArrayBuffer>;
    this.floatDataArray = new Float32Array(this.bufferLength) as Float32Array<ArrayBuffer>;

    if (sourceNode) {
      sourceNode.connect(this.analyser);
    }
  }

  /**
   * Connect an audio source node to the analyzer
   */
  connect(sourceNode: AudioNode): void {
    sourceNode.connect(this.analyser);
  }

  /**
   * Update frequency data
   */
  update(): void {
    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getFloatFrequencyData(this.floatDataArray);
  }

  /**
   * Get normalized frequency data (0-1 range)
   */
  getFrequencyData(): Float32Array {
    this.update();
    const normalized = new Float32Array(this.bufferLength);
    for (let i = 0; i < this.bufferLength; i++) {
      normalized[i] = this.dataArray[i] / 255;
    }
    return normalized;
  }

  /**
   * Get average frequency intensity
   */
  getAverageIntensity(): number {
    this.update();
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / (this.bufferLength * 255);
  }

  /**
   * Get bass intensity (low frequencies)
   */
  getBassIntensity(): number {
    this.update();
    const bassRange = Math.floor(this.bufferLength * 0.2);
    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
      sum += this.dataArray[i];
    }
    return sum / (bassRange * 255);
  }

  /**
   * Get mid range intensity
   */
  getMidIntensity(): number {
    this.update();
    const start = Math.floor(this.bufferLength * 0.2);
    const end = Math.floor(this.bufferLength * 0.6);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += this.dataArray[i];
    }
    return sum / ((end - start) * 255);
  }

  /**
   * Get treble intensity (high frequencies)
   */
  getTrebleIntensity(): number {
    this.update();
    const start = Math.floor(this.bufferLength * 0.6);
    let sum = 0;
    for (let i = start; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / ((this.bufferLength - start) * 255);
  }

  /**
   * Get analyzer node for connecting to other audio nodes
   */
  getAnalyserNode(): AnalyserNode {
    return this.analyser;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.analyser.disconnect();
  }
}
