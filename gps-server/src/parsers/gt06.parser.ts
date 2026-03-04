/**
 * GT06 Protocol Parser
 * Supports GT06, GT06N, and compatible GPS trackers
 */

export class GT06Parser {
  private readonly HEADER = Buffer.from([0x78, 0x78]);
  private readonly FOOTER = Buffer.from([0x0D, 0x0A]);

  parse(data: Buffer): any {
    try {
      // Check for valid header
      if (data.length < 15) {
        return null;
      }

      // Find header
      let startIdx = 0;
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0x78 && data[i + 1] === 0x78) {
          startIdx = i;
          break;
        }
      }

      if (startIdx === -1) {
        return null;
      }

      const packet = data.slice(startIdx);
      
      // Minimum packet length: header(2) + length(1) + protocol(1) + data(10+) + serial(2) + checksum(2) + footer(2)
      if (packet.length < 18) {
        return null;
      }

      const length = packet[2];
      const protocol = packet[3];

      // Parse based on protocol type
      switch (protocol) {
        case 0x01: // Login packet
          return this.parseLoginPacket(packet);
        case 0x12: // Location packet
        case 0x22: // Location packet (extended)
          return this.parseLocationPacket(packet);
        case 0x13: // Status packet
          return this.parseStatusPacket(packet);
        case 0x15: // String information packet
          return this.parseStringPacket(packet);
        default:
          console.log(`[GT06] Unknown protocol: 0x${protocol.toString(16)}`);
          return null;
      }
    } catch (error) {
      console.error('[GT06] Parse error:', error.message);
      return null;
    }
  }

  private parseLoginPacket(packet: Buffer): any {
    // Login packet format:
    // 78 78 | 0D | 01 | IMEI(8) | Serial(2) | CRC(2) | 0D 0A
    const imei = packet.slice(4, 12).toString('hex');
    
    return {
      type: 'login',
      imei,
      raw: packet.toString('hex'),
    };
  }

  private parseLocationPacket(packet: Buffer): any {
    // Location packet format:
    // 78 78 | 1F | 12/22 | Date(6) | GPS(1) | Lat(4) | Long(4) | Speed(1) | Course(2) | ...
    
    const dateOffset = 4;
    const year = packet[dateOffset];
    const month = packet[dateOffset + 1];
    const day = packet[dateOffset + 2];
    const hour = packet[dateOffset + 3];
    const minute = packet[dateOffset + 4];
    const second = packet[dateOffset + 5];

    const gpsInfo = packet[dateOffset + 6];
    const satellites = gpsInfo & 0x0F;
    const gpsFix = (gpsInfo >> 4) & 0x0F;

    // Latitude (4 bytes, signed, in 1/1800000 minutes)
    const latRaw = packet.readInt32BE(dateOffset + 7);
    const latitude = latRaw / 1800000;

    // Longitude (4 bytes, signed, in 1/1800000 minutes)
    const lngRaw = packet.readInt32BE(dateOffset + 11);
    const longitude = lngRaw / 1800000;

    // Speed (1 byte, km/h)
    const speed = packet[dateOffset + 15];

    // Course/status (2 bytes)
    const courseRaw = packet.readUInt16BE(dateOffset + 16);
    const heading = courseRaw & 0x03FF;
    const ignition = (courseRaw >> 10) & 0x01;

    // Get IMEI from device cache or use a placeholder
    const imei = 'unknown';

    const timestamp = new Date(2000 + year, month - 1, day, hour, minute, second);

    return {
      type: 'location',
      imei,
      latitude: this.round(latitude, 6),
      longitude: this.round(longitude, 6),
      speed,
      heading,
      altitude: 0,
      accuracy: satellites * 5,
      timestamp,
      ignition: ignition === 1,
      satellites,
      gpsFix,
      raw: packet.toString('hex'),
    };
  }

  private parseStatusPacket(packet: Buffer): any {
    // Status packet contains device status information
    const statusInfo = packet[4];
    
    return {
      type: 'status',
      imei: 'unknown',
      batteryLevel: this.getBatteryLevel(statusInfo),
      signalStrength: this.getSignalStrength(statusInfo),
      raw: packet.toString('hex'),
    };
  }

  private parseStringPacket(packet: Buffer): any {
    // String information packet (contains IMEI and other info)
    const strData = packet.slice(5, packet.length - 4).toString('ascii');
    
    return {
      type: 'string',
      imei: 'unknown',
      data: strData,
      raw: packet.toString('hex'),
    };
  }

  createAcknowledgment(packet: Buffer): Buffer | null {
    try {
      const protocol = packet[3];
      const serialNumber = packet.readUInt16BE(packet.length - 6);

      // Build acknowledgment packet
      const ack = Buffer.alloc(10);
      ack[0] = 0x78;
      ack[1] = 0x78;
      ack[2] = 0x05; // Length
      ack[3] = protocol;
      ack.writeUInt16BE(serialNumber, 4);
      
      // Calculate CRC
      const crc = this.calculateCRC(ack.slice(2, 6));
      ack.writeUInt16BE(crc, 6);
      
      ack[8] = 0x0D;
      ack[9] = 0x0A;

      return ack;
    } catch (error) {
      console.error('[GT06] ACK error:', error.message);
      return null;
    }
  }

  private calculateCRC(data: Buffer): number {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
    }
    return crc;
  }

  private getBatteryLevel(status: number): number {
    // Map status bits to battery level
    const level = status & 0x0F;
    return Math.min(level * 6.25, 100);
  }

  private getSignalStrength(status: number): number {
    // Map status bits to signal strength
    const level = (status >> 4) & 0x0F;
    return Math.min(level * 6.25, 100);
  }

  private round(num: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
}
