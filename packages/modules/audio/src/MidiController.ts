/**
 * MidiController
 *
 * Automatically detects MIDI input devices via the Web MIDI API
 * (navigator.requestMIDIAccess), routes note-on / note-off messages to
 * callbacks, and maps CC events to configurable parameter bindings.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NoteOnCallback = (note: number, velocity: number, channel: number) => void;
export type NoteOffCallback = (note: number, channel: number) => void;
export type CCCallback = (cc: number, value: number, channel: number) => void;

/** Maps a MIDI CC number to a handler function. */
export type CCMapping = Map<number, (value: number) => void>;

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

// ---------------------------------------------------------------------------
// MIDI message constants
// ---------------------------------------------------------------------------

const STATUS_NOTE_OFF = 0x80;
const STATUS_NOTE_ON = 0x90;
const STATUS_CC = 0xb0;

// ---------------------------------------------------------------------------
// MidiController class
// ---------------------------------------------------------------------------

export class MidiController {
  private access: MIDIAccess | null = null;
  private ccMappings: CCMapping = new Map();

  private noteOnCallbacks: NoteOnCallback[] = [];
  private noteOffCallbacks: NoteOffCallback[] = [];
  private ccCallbacks: CCCallback[] = [];

  private connectedDevices: MidiDevice[] = [];

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  /**
   * Request MIDI access and start listening on all connected input devices.
   * Resolves with the list of detected input devices.
   * Throws if the browser does not support the Web MIDI API or the user denies permission.
   */
  async connect(): Promise<MidiDevice[]> {
    if (!navigator.requestMIDIAccess) {
      throw new Error("Web MIDI API is not supported in this browser.");
    }

    this.access = await navigator.requestMIDIAccess({ sysex: false });

    this.access.onstatechange = (event) => this.handleStateChange(event);

    this.refreshDevices();
    return [...this.connectedDevices];
  }

  disconnect(): void {
    if (this.access) {
      // Remove onmidimessage from all inputs
      for (const input of this.access.inputs.values()) {
        input.onmidimessage = null;
      }
      this.access = null;
    }
    this.connectedDevices = [];
  }

  // -------------------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------------------

  onNoteOn(cb: NoteOnCallback): () => void {
    this.noteOnCallbacks.push(cb);
    return () => {
      this.noteOnCallbacks = this.noteOnCallbacks.filter((f) => f !== cb);
    };
  }

  onNoteOff(cb: NoteOffCallback): () => void {
    this.noteOffCallbacks.push(cb);
    return () => {
      this.noteOffCallbacks = this.noteOffCallbacks.filter((f) => f !== cb);
    };
  }

  onCC(cb: CCCallback): () => void {
    this.ccCallbacks.push(cb);
    return () => {
      this.ccCallbacks = this.ccCallbacks.filter((f) => f !== cb);
    };
  }

  // -------------------------------------------------------------------------
  // CC mappings
  // -------------------------------------------------------------------------

  /**
   * Bind a MIDI CC number to a handler function.
   * The handler receives the CC value normalised to [0, 1].
   *
   * @param cc       MIDI CC number (0–127).
   * @param handler  Called whenever this CC number is received.
   */
  mapCC(cc: number, handler: (value: number) => void): void {
    this.ccMappings.set(cc, handler);
  }

  unmapCC(cc: number): void {
    this.ccMappings.delete(cc);
  }

  clearCCMappings(): void {
    this.ccMappings.clear();
  }

  // -------------------------------------------------------------------------
  // Device list
  // -------------------------------------------------------------------------

  getDevices(): Readonly<MidiDevice[]> {
    return this.connectedDevices;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private refreshDevices(): void {
    if (!this.access) return;
    this.connectedDevices = [];

    for (const input of this.access.inputs.values()) {
      const device: MidiDevice = {
        id: input.id,
        name: input.name ?? "Unknown Device",
        manufacturer: input.manufacturer ?? "",
      };
      this.connectedDevices.push(device);

      // Attach listener
      input.onmidimessage = (event: MIDIMessageEvent) => {
        this.handleMidiMessage(event);
      };
    }
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    const port = event.port;
    if (!port || port.type !== "input") return;

    if (port.state === "connected") {
      this.refreshDevices();
    } else if (port.state === "disconnected") {
      this.connectedDevices = this.connectedDevices.filter((d) => d.id !== port.id);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0]!;
    const status = statusByte & 0xf0;
    const channel = (statusByte & 0x0f) + 1; // 1–16
    const byte1 = data[1] ?? 0;
    const byte2 = data[2] ?? 0;

    switch (status) {
      case STATUS_NOTE_ON: {
        if (byte2 === 0) {
          // Velocity 0 = note off
          this.fireNoteOff(byte1, channel);
        } else {
          this.fireNoteOn(byte1, byte2 / 127, channel);
        }
        break;
      }

      case STATUS_NOTE_OFF: {
        this.fireNoteOff(byte1, channel);
        break;
      }

      case STATUS_CC: {
        const normalised = byte2 / 127;
        this.fireCC(byte1, normalised, channel);

        // Fire mapped handler if present
        const mapped = this.ccMappings.get(byte1);
        if (mapped) mapped(normalised);
        break;
      }

      default:
        // SysEx, pitch bend, aftertouch, etc. — ignored for now
        break;
    }
  }

  private fireNoteOn(note: number, velocity: number, channel: number): void {
    for (const cb of this.noteOnCallbacks) cb(note, velocity, channel);
  }

  private fireNoteOff(note: number, channel: number): void {
    for (const cb of this.noteOffCallbacks) cb(note, channel);
  }

  private fireCC(cc: number, value: number, channel: number): void {
    for (const cb of this.ccCallbacks) cb(cc, value, channel);
  }
}
