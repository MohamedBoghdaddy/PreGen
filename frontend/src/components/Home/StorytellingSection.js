import React from "react";
import { Row, Col } from "react-bootstrap";
import "../styles/Home.css";
import MissionImage from "../../assets/mission.jpg";

const StorytellingSection = () => {
  return (
    <>
      <Row className="justify-content-center mb-5">
        <Col lg={8} className="text-center">
          <h2 className="storytelling-title">Our Mission</h2>
          <p className="lead">
            Transforming education through the power of artificial intelligence
          </p>
        </Col>
      </Row>

      <Row className="align-items-center">
        <Col lg={6} md={12} className="mb-4 mb-lg-0">
          <div className="storytelling-content">
            <p className="story-paragraph">
              We believe that every learner deserves personalized support,
              timely feedback, and guidance that helps them grow. That’s why we
              built an AI-assisted E-Learning Platform powered by Google Gemini
              — to make education more intelligent, inclusive, and adaptive.
            </p>
            <p className="story-paragraph">
              Our platform goes beyond traditional learning tools. It analyzes
              student performance, provides instant AI-driven grading, and
              generates constructive feedback to guide improvement. Teachers
              save time, students receive tailored recommendations, and parents
              stay informed — all in one connected ecosystem.
            </p>
            <p className="story-paragraph">
              This is more than technology; it’s a movement toward smarter, more
              empathetic education. We’re using AI to empower learners and
              educators everywhere — helping them focus on what truly matters:
              learning, growing, and achieving success together.
            </p>
          </div>
        </Col>

        <Col lg={6} md={12}>
          <div className="mission-image-container">
            <img
              src={MissionImage}
              alt="Empowering Education with AI"
              className="img-fluid rounded mission-image"
            />
          </div>
        </Col>
      </Row>
    </>
  );
};

export default StorytellingSection;
