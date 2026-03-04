/**
 * H02 Protocol Parser
 * Supports H02, JT600, and compatible GPS trackers
 * Protocol format: *HQ,XXXXXXXXXXXX,V1,HHMMSS,S,LLLL.LLLL,N,YYYYY.YYYY,E,SSS,AAA,DDMMYY,...
 */

export class H02Parser {
  parse(data: Buffer): any {
    try {
      const message = data.toString('ascii').trim();
      
      if (message.length < 30) {
        return null;
      }

      // H02 messages start with *HQ,
      if (!message.startsWith('*HQ,')) {
        console.log(`[H02] Invalid message format: ${message.substring(0, 50)}`);
        return null;
      }

      const parts = message.split(',');
      if (parts.length < 10) {
        return null;
      }

      // Parse based on message type (V1, V2, etc.)
      const msgType = parts[2];

      switch (msgType) {
        case 'V1': // Location packet
        case 'V2': // Location packet (extended)
          return this.parseLocationPacket(parts, message);
        case 'N1': // Status packet
          return this.parseStatusPacket(parts, message);
        case 'S1': // Alarm packet
          return this.parseAlarmPacket(parts, message);
        case 'R1': // Response packet
          return this.parseResponsePacket(parts, message);
        default:
          console.log(`[H02] Unknown message type: ${msgType}`);
          return null;
      }
    } catch (error) {
      console.error('[H02] Parse error:', error.message);
      return null;
    }
  }

  private parseLocationPacket(parts: string[], raw: string): any {
    // Format: *HQ,IMEI,V1,HHMMSS,S,LLLL.LLLL,N,YYYYY.YYYY,E,SSS,AAA,DDMMYY,...
    // Example: *HQ,123456789012,V1,123045,A,2234.5678,N,11405.4321,E,045,180,240304,...

    const imei = parts[1];

    // Parse time (HHMMSS)
    const timeStr = parts[3];
    const hour = parseInt(timeStr.substring(0, 2));
    const minute = parseInt(timeStr.substring(2, 4));
    const second = parseInt(timeStr.substring(4, 6));

    // GPS fix status
    const fixStatus = parts[4];
    const gpsFix = fixStatus === 'A'; // A = valid, V = invalid

    // Parse latitude (DDMM.MMMM)
    const latStr = parts[5];
    const latDir = parts[6];
    const latDeg = parseInt(latStr.substring(0, 2));
    const latMin = parseFloat(latStr.substring(2));
    let latitude = latDeg + (latMin / 60);
    if (latDir === 'S') latitude = -latitude;

    // Parse longitude (DDDMM.MMMM)
    const lngStr = parts[7];
    const lngDir = parts[8];
    const lngDeg = parseInt(lngStr.substring(0, 3));
    const lngMin = parseFloat(lngStr.substring(3));
    let longitude = lngDeg + (lngMin / 60);
    if (lngDir === 'W') longitude = -longitude;

    // Speed (km/h)
    const speed = parseInt(parts[9]) || 0;

    // Heading/course (degrees)
    const heading = parseInt(parts[10]) || 0;

    // Parse date (DDMMYY)
    const dateStr = parts[11];
    const day = parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1;
    const year = 2000 + parseInt(dateStr.substring(4, 6));

    const timestamp = new Date(year, month, day, hour, minute, second);

    // Extract additional info if available
    let ignition = null;
    let odometer = 0;
    let batteryLevel = null;
    let altitude = 0;

    // Look for additional data in remaining parts
    for (let i = 12; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('ACC')) {
        ignition = part === 'ACC1' || part === 'ACC:1';
      } else if (part.startsWith('M')) {
        // Mileage/odometer
        const mileageMatch = part.match(/M(\d+)/);
        if (mileageMatch) {
          odometer = parseInt(mileageMatch[1]);
        }
      } else if (part.startsWith('BAT')) {
        // Battery level
        const batMatch = part.match(/BAT(\d+)/);
        if (batMatch) {
          batteryLevel = parseInt(batMatch[1]);
        }
      } else if (part.startsWith('ALT')) {
        // Altitude
        const altMatch = part.match(/ALT([\d-]+)/);
        if (altMatch) {
          altitude = parseInt(altMatch[1]);
        }
      }
    }

    return {
      type: 'location',
      imei,
      latitude: this.round(latitude, 6),
      longitude: this.round(longitude, 6),
      speed,
      heading,
      altitude,
      accuracy: gpsFix ? 10 : 50,
      timestamp,
      ignition,
      odometer,
      batteryLevel,
      gpsFix,
      raw,
    };
  }

  private parseStatusPacket(parts: string[], raw: string): any {
    // Status packet format
    const imei = parts[1];

    let batteryLevel = null;
    let signalStrength = null;
    let deviceStatus = null;

    for (let i = 3; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('BAT')) {
        const batMatch = part.match(/BAT(\d+)/);
        if (batMatch) batteryLevel = parseInt(batMatch[1]);
      } else if (part.startsWith('SIG')) {
        const sigMatch = part.match(/SIG(\d+)/);
        if (sigMatch) signalStrength = parseInt(sigMatch[1]);
      } else if (part.startsWith('ST')) {
        deviceStatus = part;
      }
    }

    return {
      type: 'status',
      imei,
      batteryLevel,
      signalStrength,
      deviceStatus,
      raw,
    };
  }

  private parseAlarmPacket(parts: string[], raw: string): any {
    // Alarm packet format
    const imei = parts[1];
    
    let alarmType = 'unknown';
    const alarmCode = parts[3];

    switch (alarmCode) {
      case 'S1':
        alarmType = 'sos';
        break;
      case 'L1':
        alarmType = 'low_battery';
        break;
      case 'M1':
        alarmType = 'motion';
        break;
      case 'G1':
        alarmType = 'geofence';
        break;
      case 'S2':
        alarmType = 'overspeed';
        break;
      default:
        alarmType = `unknown_${alarmCode}`;
    }

    return {
      type: 'alarm',
      imei,
      alarmType,
      raw,
    };
  }

  private parseResponsePacket(parts: string[], raw: string): any {
    // Response to command
    const imei = parts[1];
    
    return {
      type: 'response',
      imei,
      response: parts.slice(3).join(','),
      raw,
    };
  }

  createAcknowledgment(data: Buffer): Buffer | null {
    try {
      const message = data.toString('ascii').trim();
      const parts = message.split(',');
      
      if (parts.length < 2) return null;

      const imei = parts[1];
      const ackMessage = `*HQ,${imei},V4,R1#`;
      
      return Buffer.from(ackMessage);
    } catch (error) {
      console.error('[H02] ACK error:', error.message);
      return null;
    }
  }

  private round(num: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
}
