import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { authGuard } from './core/guards/auth-guard';
import { merchantGuard } from './core/guards/merchant-guard';
import { adminGuard } from './core/guards/admin-guard';
import { MerchantDashboardComponent } from './features/merchant/merchant-dashboard/merchant-dashboard';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout';
import { StoreManagementComponent } from './features/admin/store-management/store-management';
import { MasterCatalogComponent } from './features/admin/master-catalog/master-catalog';
import { BannersManagementComponent } from './features/admin/banners-management/banners-management';
import { AdminBundlesComponent } from './features/admin/admin-bundles/admin-bundles';
import { MyInventoryComponent } from './features/merchant/catalog/my-inventory/my-inventory';
import { StoreCatalogComponent } from './features/customer/store-catalog/store-catalog.component';
import { HomeComponent } from './features/customer/home/home.component';
import { CheckoutComponent } from './features/customer/checkout/checkout.component';
import { MerchantSettingsComponent } from './features/merchant/merchant-settings/merchant-settings.component';
import { MerchantOrdersComponent } from './features/merchant/merchant-orders/merchant-orders.component';
import { CustomerOrdersComponent } from './features/customer/customer-orders/customer-orders.component';
import { MerchantBundlesComponent } from './features/merchant/bundles/bundles.component';
import { MerchantBannersComponent } from './features/merchant/merchant-banners/merchant-banners.component';
import { MerchantPosComponent } from './features/merchant/pos/merchant-pos.component';
import { MerchantLayoutComponent } from './features/merchant/merchant-layout/merchant-layout';
import { MerchantAnalyticsComponent } from './features/merchant/merchant-analytics/merchant-analytics.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'tiendas/:slug', component: StoreCatalogComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'orders', component: CustomerOrdersComponent, canActivate: [authGuard] },
  {
    path: 'merchant',
    component: MerchantLayoutComponent,
    canActivate: [authGuard, merchantGuard],
    children: [
      { path: 'dashboard', component: MerchantDashboardComponent },
      { path: 'pos', component: MerchantPosComponent },
      { path: 'inventory', component: MyInventoryComponent },
      { path: 'settings', component: MerchantSettingsComponent },
      { path: 'orders', component: MerchantOrdersComponent },
      { path: 'bundles', component: MerchantBundlesComponent },
      { path: 'banners', component: MerchantBannersComponent },
      { path: 'analytics', component: MerchantAnalyticsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'stores', component: StoreManagementComponent },
      { path: 'catalog', component: MasterCatalogComponent },
      { path: 'banners', component: BannersManagementComponent },
      { path: 'bundles', component: AdminBundlesComponent },
      { path: '', redirectTo: 'stores', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
