import "../styles/WhyGreenCart.css";

function WhyGreenCart() {
  const benefits = [
    {
      icon: "🌱",
      title: "Organic & Natural",
      description:
        "Discover carefully selected products made with natural and organic ingredients.",
    },
    {
      icon: "♻️",
      title: "Sustainable Choices",
      description:
        "Choose proucts that are better for everyday living and kinder to the planet.",
    },
    {
      icon: "🤖",
      title: "AI-Powered",
      description:
        "Get personalized product recommendations based on your needs and preferences.",
    },
    {
      icon: "🛡️",
      title: "Trusted Products",
      description:
        "Explore products with detailed information about ingredients, benefits and sustainability.",
    },
    {
      icon: "📦",
      title: "Eco-Friendly Shopping",
      description:
        "Make more conscious shopping decisions with sustainability information at every step.",
    },
  ];

  return (
    <section className="why-section" id="about">

      {/* Header */}
      <div className="why-header">
        <p className="why-tag">
          WHY GREENCART
        </p>

        <h2>
          Shopping That Is Good
          <br />
          <span>For You & The Planet</span>
        </h2>

        <p className="why-description">
          GreenCart combines organic products, smart recommendations and
          sustainable choices to create a better everyday shopping experience.
        </p>
      </div>

      {/* Benefits */}
      <div className="why-grid">
        {benefits.map((benefit, index) => (
          <div className="why-card" key={index}>

            <div className="why-icon">
              {benefit.icon}
            </div>

            <h3>
              {benefit.title}
            </h3>

            <p>
              {benefit.description}
            </p>

          </div>
        ))}
      </div>

      {/* Bottom sustainability message */}
      <div className="why-bottom">

        <div className="why-bottom-icon">
          🌍
        </div>

        <div>
          <h3>
            Every Better Choice Matters
          </h3>

          <p>
            From personal care to household essentials, GreenCart helps you
            discover alternatives that fit your lifestyle and sustainability
            preferences.
          </p>
        </div>

      </div>

    </section>
  );
}

export default WhyGreenCart;