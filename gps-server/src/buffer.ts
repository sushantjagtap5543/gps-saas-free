import { EventEmitter } from 'events';

export interface Position {
  type: string;
  protocol: string;
  imei?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  ignition?: boolean;
  [key: string]: any;
}

export class PositionBuffer extends EventEmitter {
  private buffer: Position[] = [];
  private readonly maxSize = 10000;

  add(position: Position): void {
    this.buffer.push(position);
    
    // Trim old positions
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }

    // Emit to subscribers
    this.emit('position', position);
  }

  getRecent(count: number): Position[] {
    return this.buffer.slice(-count);
  }

  getSince(timestamp: Date): Position[] {
    return this.buffer.filter(p => p.timestamp >= timestamp);
  }

  subscribe(callback: (position: Position) => void): () => void {
    this.on('position', callback);
    return () => this.off('position', callback);
  }

  clear(): void {
    this.buffer = [];
  }
}
