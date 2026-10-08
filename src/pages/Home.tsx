import Nav from '../components/layout/Nav';
import About from '../components/sections/About/About';
import Hero from '../components/sections/Hero/Hero';
import Styles from '../components/sections/Styles/Styles';
import { IonContent, IonPage } from '@ionic/react';

interface HomeProps {
  isEntered: boolean;
  onProgress: (ratio: number) => void;
  onModelsReady: () => void;
}

// About is the pinned back layer. The hero overlaps it with a negative margin
// so it reads as sitting in front while scrolling, then styles takes over.
const Home: React.FC<HomeProps> = ({ isEntered, onProgress, onModelsReady }) => (
  <IonPage>
    <IonContent>
      <Nav />
      <About />
      <Hero isEntered={isEntered} onProgress={onProgress} onReady={onModelsReady} />
      <Styles />
    </IonContent>
  </IonPage>
);

export default Home;