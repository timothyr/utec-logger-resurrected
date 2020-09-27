import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

const MAX_RPM = 7200;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  loadCells;
  rpmCells;

  cellHits = {};

  constructor(private router: Router) { 
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

  ngOnInit(): void { }

  getCellHit(rpm: number, load: number) {
    const hit = this.cellHits[rpm][load];
    if (hit.length === 0) {
      return 0;
    }

    return 1;
  }

}
