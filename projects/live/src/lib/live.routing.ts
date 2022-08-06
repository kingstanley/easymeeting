import { Routes, RouterModule } from '@angular/router';
import { ContainerComponent } from './components/container/container.component';
import { CreateComponent } from './components/create/create.component';
import { JoinComponent } from './components/join/join.component';
import { LiveComponent } from './components/live/live.component';

const routes: Routes = [
  { path: '', component: ContainerComponent },
  { path: 'join', component: JoinComponent },
  { path: 'live/:id', component: LiveComponent },
  { path: 'create', component: CreateComponent },
];

export const LiveRoutes = RouterModule.forChild(routes);
