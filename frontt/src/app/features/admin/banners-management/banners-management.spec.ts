import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannersManagement } from './banners-management';

describe('BannersManagement', () => {
  let component: BannersManagement;
  let fixture: ComponentFixture<BannersManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannersManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(BannersManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
