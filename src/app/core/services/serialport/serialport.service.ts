import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.

import * as serialport from 'serialport';

@Injectable({
  providedIn: 'root'
})
export class SerialPortService {

  SerialPort: typeof serialport;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.SerialPort = window.require('serialport');
    }
  }
}
