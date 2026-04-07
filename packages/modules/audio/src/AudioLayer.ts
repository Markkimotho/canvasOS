/**
 * AudioLayer
 *
 * Loads audio files (WAV / MP3 / FLAC / OGG / AAC) via the Web Audio API,
 * provides waveform Float32Array data for visualisation, and supports
 * frame-accurate seeking for synchronisation with the animation timeline.
 */

export class AudioLayer {
  private context: AudioContext;
  private buffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;

  /** Wall-clock time (AudioContext.currentTime) at which playback started. */
  private playStartTime = 0;
  /** Audio-buffer offset (seconds) at which playback started. */
  private playStartOffset = 0;
  /** Current playback position in seconds when paused. */
  private pausedAt = 0;

  private _isPlaying = false;

  constructor(context?: AudioContext) {
    this.context = context ?? new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  /**
   * Decode and cache an audio File.  Supports WAV, MP3, FLAC, OGG, AAC —
   * whatever the browser's AudioContext.decodeAudioData accepts.
   */
  async load(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(arrayBuffer);
    this.pausedAt = 0;
  }

  /**
   * Load from a URL (e.g. a blob URL or a remote asset).
   */
  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`AudioLayer: failed to fetch ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(arrayBuffer);
    this.pausedAt = 0;
  }

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------

  play(): void {
    if (!this.buffer || this._isPlaying) return;

    // Resume suspended context (required by browsers after user gesture)
    if (this.context.state === "suspended") {
      void this.context.resume();
    }

    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this.pausedAt = 0;
      }
    };

    this.playStartOffset = this.pausedAt;
    this.playStartTime = this.context.currentTime;
    this.sourceNode.start(0, this.playStartOffset);
    this._isPlaying = true;
  }

  pause(): void {
    if (!this._isPlaying || !this.sourceNode) return;

    const elapsed = this.context.currentTime - this.playStartTime;
    this.pausedAt = this.playStartOffset + elapsed;

    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this._isPlaying = false;
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._isPlaying = false;
    this.pausedAt = 0;
  }

  // -------------------------------------------------------------------------
  // Frame-accurate sync
  // -------------------------------------------------------------------------

  /**
   * Seek to the audio position that corresponds to `frame` in a `fps`-rate
   * animation.  Restarts playback from the new position if currently playing.
   *
   * @param frame  Zero-based frame index.
   * @param fps    Frames per second of the animation timeline.
   */
  seekToFrame(frame: number, fps: number): void {
    const wasPlaying = this._isPlaying;
    if (wasPlaying) this.pause();

    const seconds = frame / fps;
    this.pausedAt = this.buffer ? Math.min(seconds, this.buffer.duration) : seconds;

    if (wasPlaying) this.play();
  }

  // -------------------------------------------------------------------------
  // Volume
  // -------------------------------------------------------------------------

  setVolume(volume: number): void {
    // volume: 0.0 – 1.0
    this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime);
  }

  // -------------------------------------------------------------------------
  // Waveform data
  // -------------------------------------------------------------------------

  /**
   * Downsample the first channel of the decoded audio buffer to `samples`
   * points, normalised to [−1, 1].  Returns an empty Float32Array if no
   * buffer is loaded.
   *
   * @param samples  Number of output data points (e.g. 512 for a waveform view).
   */
  getWaveformData(samples: number): Float32Array {
    if (!this.buffer || samples <= 0) return new Float32Array(0);

    const channel = this.buffer.getChannelData(0);
    const result = new Float32Array(samples);
    const blockSize = Math.floor(channel.length / samples);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channel[start + j] ?? 0);
      }
      result[i] = sum / blockSize;
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this.buffer?.duration ?? 0;
  }

  /** Current playback position in seconds. */
  get currentTime(): number {
    if (this._isPlaying) {
      return this.playStartOffset + (this.context.currentTime - this.playStartTime);
    }
    return this.pausedAt;
  }

  getAudioContext(): AudioContext {
    return this.context;
  }

  destroy(): void {
    this.stop();
    this.gainNode.disconnect();
    void this.context.close();
  }
}
