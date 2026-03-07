import './styles.css';
import { GameApp } from './app/GameApp';

const root = document.querySelector<HTMLDivElement>('#app');
if (root === null) {
  throw new Error('Root element #app not found');
}

new GameApp(root);
