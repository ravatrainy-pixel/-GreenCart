import "./About.css";
import { Link } from "react-router-dom";

const values = [
  {
    icon: "🌿",
    title: "Natural Living",
    description:
      "We make it easier to discover products that support a more natural and thoughtful lifestyle.",
  },
  {
    icon: "♻️",
    title: "Conscious Choices",
    description:
      "We encourage reusable essentials and mindful shopping choices that can help reduce everyday waste.",
  },
  {
    icon: "💚",
    title: "Customer First",
    description:
      "We aim to provide a simple, convenient, and welcoming shopping experience for every customer.",
  },
];

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">WELCOME TO GREENCART</span>
          <h1>A greener choice for everyday living.</h1>
          <p>
            Discover thoughtfully selected skincare, haircare, organic snacks,
            clothing, and home essentials—all in one convenient place.
          </p>

          <div className="about-actions">
            <Link to="/shop" className="about-primary-btn">
              Explore Products
            </Link>
            <Link to="/" className="about-secondary-btn">
              Back to Home
            </Link>
          </div>
        </div>

        <div className="about-hero-art" aria-hidden="true">
          <span className="about-art-circle about-art-circle-one" />
          <span className="about-art-circle about-art-circle-two" />
          <div className="about-plant">🌱</div>
          <div className="about-art-caption">
            <span>Live naturally</span>
            <strong>Choose thoughtfully.</strong>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div className="about-section-label">OUR STORY</div>
        <h2>Small choices can make a difference.</h2>
        <p>
          GreenCart is an e-commerce project created to bring a variety of
          everyday products together in one place. From personal-care
          essentials to reusable home products, our goal is to make browsing
          and shopping simple and convenient.
        </p>
        <p>
          We believe that thoughtful everyday choices can help people build
          more conscious habits. GreenCart brings this idea to life through a
          clean shopping experience where customers can explore products,
          discover categories, and find items suited to their needs.
        </p>
      </section>

      <section className="about-values">
        <div className="about-section-label">WHAT MATTERS TO US</div>
        <h2>Shopping with purpose</h2>
        <p className="about-section-intro">
          The principles behind the GreenCart experience.
        </p>

        <div className="about-values-grid">
          {values.map((value) => (
            <article className="about-value-card" key={value.title}>
              <div className="about-value-icon">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <span>YOUR GREENER SHOPPING JOURNEY</span>
        <h2>Find your everyday essentials.</h2>
        <p>
          Browse our collections and discover products for your daily routine.
        </p>
        <Link to="/shop" className="about-primary-btn">
          Start Shopping
        </Link>
      </section>
    </main>
  );
}
