import Hero from "../components/Hero";
import Products from "../components/Products";
import WhyGreenCart from "../components/WhyGreenCart";
import AIRecommendations from "../components/AIRecommendations";
import SustainabilityImpact from "../components/SustainabilityImpact";
import Newsletter from "../components/Newsletter";

function Home() {
  return (
    <>
      <Hero />
      <Products />
      <WhyGreenCart />
      <AIRecommendations />
      <SustainabilityImpact />
      <Newsletter />
    </>
  );
}

export default Home;