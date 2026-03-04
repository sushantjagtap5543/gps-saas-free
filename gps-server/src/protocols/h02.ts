export class H02Decoder {
  decode(data: Buffer): any {
    const message = data.toString('ascii').trim();
    
    // H02 format: *HQ,123456789012345,V1,235959,A,1929.9999,N,07253.9999,E,0.00,0,010123,ffffffff,000000,000000,000000,000000#
    if (!message.startsWith('*HQ,')) {
      return null;
    }

    const parts = message.split(',');
    if (parts.length < 10) return null;

    try {
      const imei = parts[1];
      const cmd = parts[2]; // V1=GPS valid, V0=GPS invalid
      const time = parts[3];
      const validity = parts[4]; // A=Valid, V=Invalid
      const lat = parts[5];
      const latDir = parts[6];
      const lng = parts[7];
      const lngDir = parts[8];
      const speed = parts[9];

      return {
        type: 'position',
        protocol: 'h02',
        imei,
        timestamp: new Date(), // Parse from parts if available
        latitude: this.parseCoordinate(lat, latDir),
        longitude: this.parseCoordinate(lng, lngDir),
        speed: parseFloat(speed) || 0,
        isValid: validity === 'A' && cmd === 'V1',
        raw: message,
      };
    } catch (error) {
      console.error('H02 decode error:', error);
      return null;
    }
  }

  private parseCoordinate(coord: string, direction: string): number {
    const degrees = parseFloat(coord.substr(0, coord.length - 6));
    const minutes = parseFloat(coord.substr(-6)) / 60;
    let decimal = degrees + minutes;
    if (direction === 'S' || direction === 'W') decimal = -decimal;
    return decimal;
  }
}
