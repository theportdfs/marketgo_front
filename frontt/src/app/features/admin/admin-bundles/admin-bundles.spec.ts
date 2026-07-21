import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBundles } from './admin-bundles';

describe('AdminBundles', () => {
  let component: AdminBundles;
  let fixture: ComponentFixture<AdminBundles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBundles],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBundles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
