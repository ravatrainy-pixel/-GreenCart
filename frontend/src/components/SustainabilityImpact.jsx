import "../styles/SustainabilityImpact.css";

function SustainabilityImpact() {
  const impacts = [
    {
      icon: "🌿",
      value: "100%",
      title: "Mindful Choices",
      description: "Products selected with sustainability in mind.",
    },
    {
      icon: "♻️",
      value: "Eco",
      title: "Better Packaging",
      description: "Encouraging reusable and environmentally conscious options.",
    },
    {
      icon: "🌍",
      value: "Green",
      title: "Planet Friendly",
      description: "Small shopping choices can support a healthier planet.",
    },
    {
      icon: "💚",
      value: "Smart",
      title: "AI Powered",
      description: "Personalized recommendations to help you shop thoughtfully.",
    },
  ];

  return (
    <section className="sustainability-section" id="sustainability">
      <div className="sustainability-leaf sustainability-leaf-one">
        🌿
      </div>

      <div className="sustainability-leaf sustainability-leaf-two">
        🍃
      </div>

      <div className="sustainability-header">
        <span className="sustainability-tag">
          🌍 SHOP WITH PURPOSE
        </span>

        <h2>
          Better Choices for
          <span> a Better Planet</span>
        </h2>

        <p>
          GreenCart brings together thoughtful products, smart
          recommendations and sustainable choices to make everyday
          shopping more conscious.
        </p>
      </div>

      <div className="impact-grid">
        {impacts.map((impact, index) => (
          <div className="impact-card" key={index}>
            <div className="impact-icon">
              {impact.icon}
            </div>

            <div className="impact-value">
              {impact.value}
            </div>

            <h3>{impact.title}</h3>

            <p>{impact.description}</p>
          </div>
        ))}
      </div>

      <div className="sustainability-bottom">
        <div className="sustainability-bottom-icon">
          🌱
        </div>

        <div>
          <strong>
            Every purchase is a chance to make a difference.
          </strong>

          <p>
            Discover products that fit your lifestyle while keeping
            sustainability in mind.
          </p>
        </div>
      </div>
    </section>
  );
}

export default SustainabilityImpact;