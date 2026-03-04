export class TK103Decoder {
  decodeLogin(message: string): any {
    // Format: ##,imei:123456789012345,A;
    const match = message.match(/imei:(\d+)/);
    if (!match) return null;

    return {
      imei: match[1],
      type: 'login',
      protocol: 'tk103',
    };
  }

  decodePosition(message: string, imei: string): any {
    // Format: imei:123456789012345,tracker,230101235959,,F,235959.000,A,1929.9999,N,07253.9999,E,0.00,0;
    const parts = message.split(',');
    if (parts.length < 10) return null;

    try {
      const date = parts[2]; // YYMMDDHHMMSS
      const validity = parts[4]; // A=Valid, V=Invalid
      const time = parts[5]; // HHMMSS.000
      const lat = parts[7]; // DDMM.MMMM
      const latDir = parts[8]; // N/S
      const lng = parts[9]; // DDDMM.MMMM
      const lngDir = parts[10]; // E/W
      const speed = parts[11]; // Speed in km/h

      return {
        type: 'position',
        protocol: 'tk103',
        imei,
        timestamp: this.parseDate(date),
        latitude: this.parseCoordinate(lat, latDir),
        longitude: this.parseCoordinate(lng, lngDir),
        speed: parseFloat(speed) || 0,
        isValid: validity === 'A',
        raw: message,
      };
    } catch (error) {
      console.error('TK103 decode error:', error);
      return null;
    }
  }

  private parseDate(dateStr: string): Date {
    const year = 2000 + parseInt(dateStr.substr(0, 2));
    const month = parseInt(dateStr.substr(2, 2)) - 1;
    const day = parseInt(dateStr.substr(4, 2));
    const hour = parseInt(dateStr.substr(6, 2));
    const minute = parseInt(dateStr.substr(8, 2));
    const second = parseInt(dateStr.substr(10, 2));
    return new Date(year, month, day, hour, minute, second);
  }

  private parseCoordinate(coord: string, direction: string): number {
    const degrees = parseFloat(coord.substr(0, coord.length - 6));
    const minutes = parseFloat(coord.substr(-6)) / 60;
    let decimal = degrees + minutes;
    if (direction === 'S' || direction === 'W') decimal = -decimal;
    return decimal;
  }
}
