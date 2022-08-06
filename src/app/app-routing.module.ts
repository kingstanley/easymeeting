import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
// import { TopNavComponent } from 'libs/dashboard/src/lib/components/top-nav/top-nav.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // {
  //   path: 'meeting',
  //   component: TopNavComponent,
  //   children: [
  //     {
  //       path: '',
  //       loadChildren: () => import('@meet/live').then((m) => m.LiveModule),
  //     },
  //   ],
  // },
  {
    path: 'meeting',
    loadChildren: () => import('projects/live/src').then((m) => m.LiveModule),
  },
  {
    path: 'account',
    loadChildren: () =>
      import('projects/account/src').then((a) => a.AccountModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
