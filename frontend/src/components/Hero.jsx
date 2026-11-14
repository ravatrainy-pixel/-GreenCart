import { useNavigate } from "react-router-dom";
import "../styles/Hero.css";
import heroImage from "../assets/hero-greencart.png";

function Hero() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: "🌱",
      title: "Organic",
      description: "Natural Products",
    },
    {
      icon: "♻️",
      title: "Sustainable",
      description: "Planet Friendly",
    },
    {
      icon: "🛡️",
      title: "Trusted",
      description: "Quality Products",
    },
  ];

  return (
    <section className="hero" id="home">

      {/* LEFT CONTENT */}

      <div className="hero-content">

        <p className="hero-tag">
          🌿 GOOD FOR YOU • GOOD FOR THE PLANET
        </p>

        <h1>
          Organic Choices
          <br />
          for a <span>Greener</span>
          <br />
          <span>Tomorrow</span>
        </h1>

        <p className="hero-description">
          Discover carefully selected organic and sustainable products
          designed for your everyday lifestyle while caring for our planet.
        </p>

        {/* Buttons */}

        <div className="hero-buttons">

          {/* Shop Now */}

          <button
            className="primary-button"
            onClick={() => navigate("/shop")}
          >
            Shop Now
            <span>→</span>
          </button>


          {/* AI Recommendations */}

          <button
            className="secondary-button"
            onClick={() => {
              document
                .getElementById("ai-recommendations")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
          >
            🤖
            <span>Get AI Recommendations</span>
          </button>

        </div>


        {/* BENEFITS */}

        <div className="hero-benefits">

          {benefits.map((benefit, index) => (
            <div
              className="hero-benefit-card"
              key={index}
            >

              <div className="benefit-icon">
                {benefit.icon}
              </div>

              <div className="benefit-content">

                <strong>
                  {benefit.title}
                </strong>

                <small>
                  {benefit.description}
                </small>

              </div>

            </div>
          ))}

        </div>

      </div>


      {/* RIGHT IMAGE */}

      <div
        className="hero-visual"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="hero-image-overlay"></div>
      </div>

    </section>
  );
}

export default Hero;