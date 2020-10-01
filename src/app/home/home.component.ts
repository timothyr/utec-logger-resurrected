import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ElectronService, SerialPortService } from 'app/core/services';
import { combineLatest, Subscription } from 'rxjs';

const MAX_RPM = 7200;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {

  loadCells;
  rpmCells;

  cellHits = {};

  dataSubscription: Subscription = null;

  error: any = null;

  logging = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private electronService: ElectronService,
    private serialPortService: SerialPortService
  ) {
    this.loadCells = Array(11).fill(1).map((x, i) => i * 10);
    this.rpmCells = [];
    this.initLogs();
  }

  initLogs() {
    for (let rpm = 500; rpm < MAX_RPM; rpm += 250) {
      this.rpmCells.push(rpm);
      this.cellHits[rpm] = {};
      this.loadCells.forEach(load => {
        this.cellHits[rpm][load] = [];
      });
    }
  }

  clearLogs() {
    this.rpmCells.forEach(rpm => {
      this.cellHits[rpm] = {};
      this.loadCells.forEach(load => {
        this.cellHits[rpm][load] = [];
      });
    });
    this.cdr.detectChanges();
  }

  stopLogging() {
    if (this.electronService.isElectron) {
      this.dataSubscription.unsubscribe();
      this.serialPortService.closePorts();
      this.logging = false;
      this.cdr.detectChanges();
    }
  }

  startLogging() {
    if (this.electronService.isElectron) {
      this.logging = true;
      this.error = null;
      this.dataSubscription = this.serialPortService.openPorts()
        .subscribe((data) => {

          console.log(data[0].rpm, data[0].load, data[1]);

          let afr = data[1];

          // If afr is Not a Number then it's garbage data
          if (isNaN(afr)) {
            return;
          }

          if (isNaN(data[0].rpm)) {
            return;
          }

          if (isNaN(data[0].load)) {
            return;
          }

          // Ignore data when car is off
          if (+data[0].rpm <= 0) {
            return;
          }

          // Cast string to number
          afr = +afr;

          // Sanity check
          if (afr > 25 || afr < 3) {
            return;
          }

          // If load data is not between 0 - 100 then it is erroneous
          if ((data[0].load - Math.floor(data[0].load)) !== 0) {
            return;
          }

          // Get closest rpm cell to the current rpm 
          // e.g. 765 rpm -> 750 rpm cell
          const closestRpm = this.closest(data[0].rpm, this.rpmCells);

          // Count cell hit for RPM, Load and AFR
          this.cellHits[closestRpm][data[0].load].push(afr);

          // Update angular view
          this.cdr.detectChanges();
        },
        (err) => {
          console.log("Logger error", err);
          this.error = err;
          this.stopLogging();
          this.cdr.detectChanges();
        },
        () => {
          console.log("Data completed");
          this.logging = false;
          this.cdr.detectChanges();
        })
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  getCellHit(rpm: number, load: number) {
    const hits = this.cellHits[rpm][load];
    if (hits.length === 0) {
      return 0;
    }

    return +(hits.reduce((a, b) => (a + b)) / hits.length).toFixed(2);
  }

  getCellBackgroundColor(rpm: number, load: number) {
    const afr = this.getCellHit(rpm, load);

    // Default
    if (afr == 0) {
      return '#eeeeee';
    }

    // From lean (16+) to rich (10-)

    if (afr > 16) {
      return '#ff6666';
    }
    if (afr > 15) {
      return '#ffbb22';
    }
    if (afr > 14) {
      return '#aabbff';
    }
    if (afr > 13) {
      return '#cceeaa';
    }
    if (afr > 12) {
      return '#aaffcc';
    }
    if (afr > 11) {
      return '#aaeeaa';
    }
    if (afr > 10) {
      return '#55ff44';
    }

    return '#00ff00';
  }

  // closest algorithm by paxdiablo: https://stackoverflow.com/a/8584940
  closest = (num: number, arr: number[]) => {
    let mid;
    let lo = 0;
    let hi = arr.length - 1;
    while (hi - lo > 1) {
      mid = Math.floor((lo + hi) / 2);
      if (arr[mid] < num) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    if (num - arr[lo] <= arr[hi] - num) {
      return arr[lo];
    }
    return arr[hi];
  }

}
