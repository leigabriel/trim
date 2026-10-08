import { IonContent, IonPage } from '@ionic/react';

import Nav from '../components/layout/Nav';
import AboutChain from '../components/sections/Location/AboutChain';
import Location from '../components/sections/Location/Location';
import './About.css';

const About: React.FC = () => (
  <IonPage>
    {/* Light tone: the page behind the nav is black. */}
    <Nav tone="light" />

    <IonContent>
      <main className="trim-about-page">
        {/* Two columns on wide viewports: copy left, keychain right. */}
        <div className="trim-about-page__grid">
          <header className="trim-about-page__head">
            <h1 className="trim-about-page__title">About Trim</h1>

            <p className="trim-about-page__subtitle">Find a style that suits you.</p>

            <div className="trim-about-page__body">
              <p>
                Trim is a hairstyle discovery and recommendation application designed to help
                customers make more informed hairstyle choices. It analyzes the user&apos;s face shape
                and provides hairstyle recommendations based on their face shape, hair type, and
                length.
              </p>

              <p>
                Beyond hairstyle discovery, Trim connects customers with barber services through
                convenient appointment booking. Users can explore available services, barber profiles,
                and shop information while sharing their recommended hairstyle as a reference for
                their barber.
              </p>
            </div>
          </header>

          <AboutChain />
        </div>

        <Location />
      </main>
    </IonContent>
  </IonPage>
);

export default About;