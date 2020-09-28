import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.

import * as serialport from 'serialport';
import * as serialport_readline from '@serialport/parser-readline';

@Injectable({
  providedIn: 'root'
})
export class SerialPortService {

  SerialPort: typeof serialport;
  Readline: typeof serialport_readline;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

// ---------AEM UEGO

// locationId: "Port_#0003.Hub_#0003"
// manufacturer: "Prolific"
// path: "COM3"
// pnpId: "USB\VID_067B&PID_2303\6&1B94C714&0&3"
// productId: "2303"
// serialNumber: "6&1b94c714&0&3"
// vendorId: "067B"

// ----------UTEC

// locationId: "Port_#0004.Hub_#0003"
// manufacturer: "Silicon Labs"
// path: "COM4"
// pnpId: "USB\VID_10C4&PID_EA60\0001"
// productId: "EA60"
// serialNumber: "0001"
// vendorId: "10C4"


  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.SerialPort = window.require('serialport');
      this.Readline = window.require('@serialport/parser-readline');

      this.SerialPort.list().then((data) => {
        console.log("ports", data);
      })

      // debug afr
      // const port = new this.SerialPort('COM3', { baudRate: 9600 });
      // const parser = port.pipe(new this.Readline({delimiter: '\n'}));
      // parser.on('data', console.log);
      
      // debug utec
      const port = new this.SerialPort('COM4', { baudRate: 19200 }, (err) => {
        if (err) {
          return console.log('Error opening COM4: ', err.message)
        }
      });

      port.write('1', (err) => {
        if (err) {
          return console.log('Error entering UTEC Logger');
        }
      })

      //  RPM   MAP  MAF TPS Site Count   Inj#1 Ign#1  Inj#1  Ign   Fuel     MAF  
      const parser = port.pipe(new this.Readline({delimiter: '\n'}));
      parser.on('data', (data) => {
        // console.log(data);
        const dataCleaned = data.replace(/ +(?= )/g,'');
        const split = dataCleaned.trim().split(' ');
        const rpm = split[0];
        const load = split[4];
        console.log('RPM / LOAD', rpm, load);
      });

    }
  }
}
