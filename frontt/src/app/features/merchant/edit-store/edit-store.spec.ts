import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStore } from './edit-store';

describe('EditStore', () => {
  let component: EditStore;
  let fixture: ComponentFixture<EditStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStore],
    }).compileComponents();

    fixture = TestBed.createComponent(EditStore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
