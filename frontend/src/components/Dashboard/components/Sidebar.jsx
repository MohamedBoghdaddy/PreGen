import React, { useState, useEffect, useRef } from "react";
import AvatarEditor from "react-avatar-editor";
import { BsBookHalf } from "react-icons/bs";
import {
  FaUserCircle,
  FaRobot,
  FaChartLine,
  FaClipboardList,
  FaCog,
  FaGraduationCap,
  FaFileAlt,
  FaTasks,
  FaBrain,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useAuthContext } from "../../../context/AuthContext";
import axios from "axios";
import "../../styles/Sidebar.css";

const Sidebar = () => {
  const { state } = useAuthContext();
  const { user, isAuthenticated } = state;
  const location = useLocation();

  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [rotate, setRotate] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  const editorRef = useRef(null);

  useEffect(() => {
    const savedPhoto = localStorage.getItem("profilePhoto");
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    } else if (user?.profilePhoto) {
      setProfilePhoto(user.profilePhoto);
    }
  }, [user]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setError("");
    }
  };

  const handleSave = async () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const dataUrl = canvas.toDataURL();

      try {
        const blob = await fetch(dataUrl).then((res) => res.blob());
        const formData = new FormData();
        formData.append("photoFile", blob, "profile-photo.png");

        const response = await axios.put(
          `http://localhost:4000/api/users/update/${user._id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const updatedPhoto = response.data.user.profilePhoto;
        setProfilePhoto(updatedPhoto);
        localStorage.setItem("profilePhoto", updatedPhoto);
        setIsEditing(false);
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        setError("Failed to upload profile photo.");
      }
    }
  };

  const linkClass = (path) =>
    `flex items-center gap-2 p-2 rounded-lg ${
      location.pathname === path
        ? "bg-indigo-600 text-white"
        : "hover:text-indigo-400"
    }`;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>
          {isAuthenticated && user ? `Hi, ${user.username}` : "Welcome Student"}
        </h2>

        {isAuthenticated && (
          <div className="profile-photo-section">
            {profilePhoto ? (
              <img
                src={`http://localhost:4000/users/${profilePhoto}`}
                alt="Profile"
                className="profile-photo"
              />
            ) : (
              <FaUserCircle size={80} />
            )}
            <Button
              variant="secondary"
              onClick={() => setIsEditing(!isEditing)}
              className="mt-2"
            >
              Edit Photo
            </Button>

            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {image && (
                  <>
                    <AvatarEditor
                      ref={editorRef}
                      image={image}
                      width={150}
                      height={150}
                      border={20}
                      borderRadius={100}
                      scale={scale}
                      rotate={rotate}
                    />
                    <div className="mt-2">
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                      />
                      <Button
                        variant="outline-dark"
                        onClick={() => setRotate((r) => r + 90)}
                        className="ms-2"
                      >
                        Rotate
                      </Button>
                      <Button
                        variant="success"
                        onClick={handleSave}
                        className="ms-2"
                      >
                        Save
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
            {error && <p className="error-message">{error}</p>}
          </div>
        )}
      </div>

      {/* Profile preview modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Profile Photo Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={`http://localhost:4000/users/${profilePhoto}`}
            alt="Profile Preview"
            className="img-fluid"
            style={{ maxWidth: "100%", borderRadius: "50%" }}
          />
        </Modal.Body>
      </Modal>

      {/* Sidebar menu */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            <FaGraduationCap /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/courses" className={linkClass("/courses")}>
            <BsBookHalf /> My Courses
          </Link>
        </li>
        <li>
          <Link to="/ai-tutor" className={linkClass("/ai-tutor")}>
            <FaRobot /> AI Tutor
          </Link>
        </li>
        <li>
          <Link to="/quizzes" className={linkClass("/quizzes")}>
            <FaClipboardList /> Quizzes
          </Link>
        </li>
        <li>
          <Link to="/notes" className={linkClass("/notes")}>
            <FaFileAlt /> Study Notes
          </Link>
        </li>
        <li>
          <Link to="/progress" className={linkClass("/progress")}>
            <FaChartLine /> Progress Analytics
          </Link>
        </li>
        <li>
          <Link to="/assignments" className={linkClass("/assignments")}>
            <FaTasks /> Assignments
          </Link>
        </li>
        <li>
          <Link to="/practice-lab" className={linkClass("/practice-lab")}>
            <FaBrain /> Practice Lab
          </Link>
        </li>
        <li>
          <Link to="/settings" className={linkClass("/settings")}>
            <FaCog /> Settings
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default React.memo(Sidebar);
