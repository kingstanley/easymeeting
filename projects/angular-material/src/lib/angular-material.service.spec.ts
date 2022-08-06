import { TestBed } from '@angular/core/testing';

import { AngularMaterialService } from './angular-material.service';

describe('AngularMaterialService', () => {
  let service: AngularMaterialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularMaterialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
