import { Parser } from 'binary-parser';

export class GT06Decoder {
  private parser: Parser;

  constructor() {
    this.parser = new Parser()
      .endianess('big')
      .uint16('header')
      .uint8('length')
      .uint8('protocol');
  }

  decode(data: Buffer): any {
    // Check header (0x7878 or 0x7979)
    const header = data.readUInt16BE(0);
    if (header !== 0x7878 && header !== 0x7979) {
      return null;
    }

    const length = data.readUInt8(2);
    const protocol = data.readUInt8(3);

    // Protocol 0x01: Login
    if (protocol === 0x01) {
      return this.decodeLogin(data);
    }

    // Protocol 0x12: Location
    if (protocol === 0x12) {
      return this.decodeLocation(data);
    }

    // Protocol 0x13: Status
    if (protocol === 0x13) {
      return this.decodeStatus(data);
    }

    return null;
  }

  private decodeLogin(data: Buffer): any {
    const imei = data.slice(4, 12).toString('hex');
    
    // Build response
    const response = Buffer.alloc(10);
    response.writeUInt16BE(0x7878, 0);
    response.writeUInt8(0x05, 2); // Length
    response.writeUInt8(0x01, 3); // Protocol
    response.writeUInt8(0x00, 4); // Serial number
    const crc = this.calculateCRC(response.slice(2, 5));
    response.writeUInt16BE(crc, 5);
    response.writeUInt16BE(0x0d0a, 7);

    return {
      type: 'login',
      protocol: 'gt06',
      imei,
      response,
    };
  }

  private decodeLocation(data: Buffer): any {
    const date = {
      year: data.readUInt8(4),
      month: data.readUInt8(5),
      day: data.readUInt8(6),
      hour: data.readUInt8(7),
      minute: data.readUInt8(8),
      second: data.readUInt8(9),
    };

    const gpsLength = data.readUInt8(10);
    const satellites = gpsLength & 0x0f;
    const latLength = gpsLength >> 4;

    const latRaw = data.readUInt32BE(11);
    const lngRaw = data.readUInt32BE(15);

    const speed = data.readUInt8(19);
    const courseStatus = data.readUInt16BE(20);

    const course = courseStatus & 0x3ff;
    const isRealtime = (courseStatus >> 10) & 1;
    const isGPSFixed = (courseStatus >> 12) & 1;
    const ignition = (courseStatus >> 13) & 1;

    // Convert coordinates (degrees + minutes format)
    const latitude = this.convertCoordinate(latRaw, data.readUInt8(10) & 0x08);
    const longitude = this.convertCoordinate(lngRaw, data.readUInt8(10) & 0x04);

    return {
      type: 'position',
      protocol: 'gt06',
      timestamp: new Date(2000 + date.year, date.month - 1, date.day, date.hour, date.minute, date.second),
      latitude,
      longitude,
      speed,
      heading: course,
      ignition: ignition === 1,
      satellites,
      isGPSFixed: isGPSFixed === 1,
      raw: data.toString('hex'),
    };
  }

  private decodeStatus(data: Buffer): any {
    return {
      type: 'status',
      protocol: 'gt06',
      batteryLevel: data.readUInt8(4),
      signalStrength: data.readUInt8(5),
    };
  }

  private convertCoordinate(raw: number, isNegative: boolean): number {
    const degrees = Math.floor(raw / 3000000);
    const minutes = (raw % 3000000) / 50000;
    const decimal = degrees + (minutes / 60);
    return isNegative ? -decimal : decimal;
  }

  private calculateCRC(data: Buffer): number {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
    }
    return crc;
  }
}
