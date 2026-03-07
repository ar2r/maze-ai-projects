import './styles.css';
import { AppController } from './app/app-controller';

const root = document.querySelector('#app');

if (!root) {
  throw new Error('App root was not found.');
}

const controller = new AppController(root as HTMLElement);
controller.mount();
