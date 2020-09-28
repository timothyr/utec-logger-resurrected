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

  constructor(
    private cdr: ChangeDetectorRef,
    private electronService: ElectronService,
    private serialPortService: SerialPortService
    ) { 
    this.loadCells = Array(11).fill(1).map((x, i) => i * 10);
    this.rpmCells = [];
    for (let rpm = 500; rpm < MAX_RPM; rpm += 250) {
      this.rpmCells.push(rpm);
      this.cellHits[rpm] = {};
      this.loadCells.forEach(load => {
        this.cellHits[rpm][load] = [];
      });
    }
  }

  ngOnInit(): void {
    if (this.electronService.isElectron) {
      this.dataSubscription = combineLatest([this.serialPortService.utecObservable, this.serialPortService.afrGaugeObservable])
      .subscribe((data) => {

        // If load data is not between 0 - 100 then it is erroneous
        if ((data[0].load - Math.floor(data[0].load)) !== 0) {
          return;
        }

        // Get closest rpm cell to the current rpm 
        // e.g. 765 rpm -> 750 rpm cell
        const closestRpm = this.closest(data[0].rpm, this.rpmCells);

        console.log("data", data[0], closestRpm);

        // Count cell hit for RPM, Load and AFR
        this.cellHits[closestRpm][data[0].load].push(data[1]);

        // Update angular view
        this.cdr.detectChanges();
      })
    }
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  getCellHit(rpm: number, load: number) {
    const hit = this.cellHits[rpm][load];
    if (hit.length === 0) {
      return 0;
    }

    return hit.length;
  }

  // closest algorithm by paxdiablo: https://stackoverflow.com/a/8584940
  closest = (num: number, arr: number[]) => {
    let mid;
    let lo = 0;
    let hi = arr.length - 1;
    while (hi - lo > 1) {
        mid = Math.floor ((lo + hi) / 2);
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
