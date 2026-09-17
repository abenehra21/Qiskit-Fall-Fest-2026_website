import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { DetailsSection } from "@/components/sections/DetailsSection";
import { HackathonSection } from "@/components/sections/HackathonSection";
import { LearnSection } from "@/components/sections/LearnSection";
import { ScheduleSection } from "@/components/sections/ScheduleSection";
import { SpeakersSection } from "@/components/sections/SpeakersSection";
import { CollaborationsSection } from "@/components/sections/CollaborationsSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { SocialsSection } from "@/components/sections/SocialsSection";
import { VenueSection } from "@/components/sections/VenueSection";
import { ScrollBirds } from "@/components/backgrounds/ScrollBirds";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* relative so the bird layer can size itself to the whole page */}
      <main className="relative">
        <ScrollBirds />
        <Hero />
        <DetailsSection />
        <HackathonSection />
        <LearnSection />
        <ScheduleSection />
        <SpeakersSection />
        <CollaborationsSection />
        <TeamSection />
        <FAQSection />
        <SocialsSection />
        <VenueSection />
      </main>
      <Footer />
    </>
  );
}
