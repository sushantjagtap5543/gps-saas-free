/**
 * TK103 Protocol Parser
 * Supports TK103, TK103B, and compatible GPS trackers
 * Protocol format: (XXXXXXYYYYYYZZZZZ...)
 */

export class TK103Parser {
  parse(data: string): any {
    try {
      // Remove parentheses if present
      const message = data.replace(/[()]/g, '').trim();
      
      if (message.length < 20) {
        return null;
      }

      // TK103 messages start with specific prefixes
      const prefix = message.substring(0, 4);

      switch (prefix) {
        case '##':
        case 'imei':
          return this.parseLoginPacket(message);
        case 'help':
          return this.parseSOSPacket(message);
        default:
          // Try to parse as location packet
          if (message.includes('A') || message.includes('N') || message.includes('E')) {
            return this.parseLocationPacket(message);
          }
          // Try to parse as status packet
          if (message.includes('status') || message.includes('battery')) {
            return this.parseStatusPacket(message);
          }
          console.log(`[TK103] Unknown message format: ${message.substring(0, 50)}`);
          return null;
      }
    } catch (error) {
      console.error('[TK103] Parse error:', error.message);
      return null;
    }
  }

  private parseLoginPacket(message: string): any {
    // Login packet: ##,imei:XXXXXXXXXXXXXX,A;
    const imeiMatch = message.match(/imei:(\d+)/i);
    const imei = imeiMatch ? imeiMatch[1] : 'unknown';

    return {
      type: 'login',
      imei,
      raw: message,
    };
  }

  private parseLocationPacket(message: string): any {
    // Location packet formats:
    // imei:XXXXXXXXXXXXXX,tracker,YYMMDDHHMMSS,,F,LLLL.LLLL,N,YYYYY.YYYY,E,SSS,AAA,DDDDDDDD,...
    // imei:XXXXXXXXXXXXXX,tracker,240304123045,,F,1234.5678,N,09876.5432,E,045,180,010324,...

    const imeiMatch = message.match(/imei:(\d+)/i);
    const imei = imeiMatch ? imeiMatch[1] : 'unknown';

    // Extract date/time
    const dateTimeMatch = message.match(/,(\d{12}),/);
    let timestamp = new Date();
    
    if (dateTimeMatch) {
      const dt = dateTimeMatch[1];
      const year = 2000 + parseInt(dt.substring(0, 2));
      const month = parseInt(dt.substring(2, 4)) - 1;
      const day = parseInt(dt.substring(4, 6));
      const hour = parseInt(dt.substring(6, 8));
      const minute = parseInt(dt.substring(8, 10));
      const second = parseInt(dt.substring(10, 12));
      timestamp = new Date(year, month, day, hour, minute, second);
    }

    // Extract GPS fix status
    const fixMatch = message.match(/,([FL]),/);
    const gpsFix = fixMatch ? fixMatch[1] === 'F' : false;

    // Extract latitude
    const latMatch = message.match(/,(\d{2,4}\.\d+),([NS]),/);
    let latitude = 0;
    if (latMatch) {
      const latValue = parseFloat(latMatch[1]);
      const latDeg = Math.floor(latValue / 100);
      const latMin = latValue % 100;
      latitude = latDeg + (latMin / 60);
      if (latMatch[2] === 'S') latitude = -latitude;
    }

    // Extract longitude
    const lngMatch = message.match(/,(\d{3,5}\.\d+),([EW]),/);
    let longitude = 0;
    if (lngMatch) {
      const lngValue = parseFloat(lngMatch[1]);
      const lngDeg = Math.floor(lngValue / 100);
      const lngMin = lngValue % 100;
      longitude = lngDeg + (lngMin / 60);
      if (lngMatch[2] === 'W') longitude = -longitude;
    }

    // Extract speed
    const speedMatch = message.match(/,[NSWE],(\d{3}),/);
    const speed = speedMatch ? parseInt(speedMatch[1]) : 0;

    // Extract heading/course
    const courseMatch = message.match(/,\d{3},(\d{3}),/);
    const heading = courseMatch ? parseInt(courseMatch[1]) : 0;

    // Extract altitude if available
    const altMatch = message.match(/alt:(\d+)/i);
    const altitude = altMatch ? parseInt(altMatch[1]) : 0;

    // Extract ignition status
    const ignitionMatch = message.match(/acc:(\d)/i);
    const ignition = ignitionMatch ? ignitionMatch[1] === '1' : null;

    // Extract odometer
    const odoMatch = message.match(/mileage:(\d+)/i) || message.match(/,([0-9A-F]{8}),/);
    const odometer = odoMatch ? parseInt(odoMatch[1], odoMatch[1].startsWith('0x') ? 16 : 10) : 0;

    // Extract battery level
    const batteryMatch = message.match(/bat:(\d+)/i);
    const batteryLevel = batteryMatch ? parseInt(batteryMatch[1]) : null;

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
      raw: message,
    };
  }

  private parseStatusPacket(message: string): any {
    // Status packet with battery and signal info
    const imeiMatch = message.match(/imei:(\d+)/i);
    const imei = imeiMatch ? imeiMatch[1] : 'unknown';

    const batteryMatch = message.match(/battery[:\s]*(\d+)/i);
    const batteryLevel = batteryMatch ? parseInt(batteryMatch[1]) : null;

    const signalMatch = message.match(/signal[:\s]*(\d+)/i);
    const signalStrength = signalMatch ? parseInt(signalMatch[1]) : null;

    return {
      type: 'status',
      imei,
      batteryLevel,
      signalStrength,
      raw: message,
    };
  }

  private parseSOSPacket(message: string): any {
    // SOS/Help me packet
    const imeiMatch = message.match(/imei:(\d+)/i);
    const imei = imeiMatch ? imeiMatch[1] : 'unknown';

    return {
      type: 'sos',
      imei,
      alert: 'SOS',
      raw: message,
    };
  }

  createAcknowledgment(message: string): string | null {
    try {
      const imeiMatch = message.match(/imei:(\d+)/i);
      if (!imeiMatch) return null;

      const imei = imeiMatch[1];
      
      // Create acknowledgment response
      return `(${imei},AP01)`;
    } catch (error) {
      console.error('[TK103] ACK error:', error.message);
      return null;
    }
  }

  private round(num: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
}
