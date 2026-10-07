import Hero from '../components/hero/Hero';
import Nav from '../components/layout/Nav';
import { IonContent, IonPage } from '@ionic/react';

interface HomeProps {
  isEntered: boolean;
}

// Landing page: navigation over the hero.
const Home: React.FC<HomeProps> = ({ isEntered }) => (
  <IonPage>
    <IonContent>
      <Nav />
      <Hero isEntered={isEntered} />
    </IonContent>
  </IonPage>
);

export default Home;