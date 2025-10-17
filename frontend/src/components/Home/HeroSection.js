import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import HeroImage from "../../assets/hero.jpg"; // You can replace with an AI/education-related image

const HeroSection = () => {
  return (
    <Container className="hero-section">
      <Row className="align-items-center">
        {/* Hero Image */}
        <Col lg={6} className="order-lg-2">
          <div className="hero-image-container">
            <img
              className="hero-image"
              src={HeroImage}
              alt="AI-Assisted E-Learning Platform"
            />
          </div>
        </Col>

        {/* Hero Content */}
        <Col lg={6} className="order-lg-1 mb-5 mb-lg-0">
          <div className="hero-content">
            <h1 className="hero_title">
              Smarter Learning with{" "}
              <span className="highlight">AI Assistance</span>
            </h1>
            <p className="hero_description">
              Experience a new era of education powered by Google Gemini AI. Our
              platform provides instant grading, personalized feedback, and
              adaptive learning paths to help students learn faster, teachers
              save time, and parents stay informed.
            </p>
            <div className="hero-buttons">
              <Button
                variant="primary"
                as={Link}
                to="/signup"
                className="me-3 hero-btn"
              >
                Get Started
              </Button>
              <Link
                to="/features"
                className="btn btn-outline-light hero-btn-alt"
              >
                Learn More
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default HeroSection;
