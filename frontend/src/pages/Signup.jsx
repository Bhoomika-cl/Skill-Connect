import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Search,
  Network,
} from "lucide-react";

import API from "../services/api.js";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    /* =========================
       FULL NAME VALIDATION
    ========================== */

    if (!formData.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    /* =========================
       USERNAME VALIDATION
    ========================== */

    if (!formData.username.trim()) {
      setError("Please enter a username.");
      return;
    }

    /* =========================
       EMAIL VALIDATION
    ========================== */

    const email = formData.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    /*
      Only exact @cirruslabs.io email addresses
      are accepted.

      Examples:
      user@cirruslabs.io       -> accepted
      user@gmail.com           -> rejected
      user@cirruslabs.io.test  -> rejected
    */

    const cirrusLabsEmailPattern =
      /^[^\s@]+@cirruslabs\.io$/i;

    if (!cirrusLabsEmailPattern.test(email)) {
      setError(
        "Please use your CirrusLabs email address ending with @cirruslabs.io."
      );
      return;
    }

    /* =========================
       PASSWORD VALIDATION
    ========================== */

    if (!formData.password) {
      setError("Please enter a password.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/api/auth/signup",
        {
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          email: email,
          password: formData.password,
        }
      );

      console.log(
        "Signup response:",
        response.data
      );

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      if (err.response) {
        const detail =
          err.response.data?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) =>
                item?.msg
                  ? item.msg
                  : "Invalid input."
              )
              .join(", ")
          );
        } else if (detail) {
          setError(String(detail));
        } else {
          setError(
            "Unable to create the account."
          );
        }
      } else if (err.request) {
        setError(
          "The backend did not respond. Make sure FastAPI is running on http://127.0.0.1:8000."
        );
      } else {
        setError(
          "Something went wrong while creating your account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* =========================
          LEFT PANEL
      ========================== */}

      <div className="signup-left-panel">

        <Link
          to="/"
          className="signup-back-link"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* BRAND */}

        <div className="signup-brand">

          <div className="signup-brand-icon">
            SC
          </div>

          <span>
            Skill<span>Connect</span>
          </span>

        </div>

        {/* LEFT CONTENT */}

        <div className="signup-left-content">

          <div className="signup-small-badge">

            <CheckCircle2 size={14} />

            Internal talent discovery

          </div>

          <h1>
            Connect people with
            <span> expertise.</span>
          </h1>

          <p>
            Create your SkillConnect profile and make
            your skills, projects, and experience easier
            for your organization to discover.
          </p>

          {/* BENEFITS */}

          <div className="signup-benefits">

            {/* BENEFIT 1 */}

            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <Search size={17} />
              </div>

              <div>

                <strong>
                  Make your skills searchable
                </strong>

                <span>
                  Help teammates discover your expertise.
                </span>

              </div>

            </div>

            {/* BENEFIT 2 */}

            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <Users size={17} />
              </div>

              <div>

                <strong>
                  Showcase your experience
                </strong>

                <span>
                  Connect your skills with the projects
                  you've worked on.
                </span>

              </div>

            </div>

            {/* BENEFIT 3 */}

            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <Network size={17} />
              </div>

              <div>

                <strong>
                  Build your professional network
                </strong>

                <span>
                  Discover people and expertise across
                  your organization.
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="signup-left-footer">
          © {new Date().getFullYear()} SkillConnect
        </div>

      </div>


      {/* =========================
          RIGHT PANEL
      ========================== */}

      <div className="signup-right-panel">

        <div className="signup-form-container">

          {/* FORM HEADER */}

          <div className="signup-form-header">

            <span className="signup-form-label">
              CREATE ACCOUNT
            </span>

            <h2>
              Create your account
            </h2>

            <p>
              Join SkillConnect and make your expertise
              discoverable.
            </p>

          </div>


          {/* =========================
              SIGNUP FORM
          ========================== */}

          <form
            onSubmit={handleSubmit}
            className="signup-form"
          >

            {/* FULL NAME */}

            <div className="signup-field">

              <label htmlFor="full_name">
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                autoComplete="name"
              />

            </div>


            {/* USERNAME */}

            <div className="signup-field">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />

            </div>


            {/* EMAIL */}

            <div className="signup-field">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@cirruslabs.io"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

              <span className="signup-password-hint">
                Use your CirrusLabs email address.
              </span>

            </div>


            {/* PASSWORD */}

            <div className="signup-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="signup-password-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

              <span className="signup-password-hint">
                Use at least 6 characters.
              </span>

            </div>


            {/* ERROR MESSAGE */}

            {error && (
              <div className="signup-message signup-error">
                {error}
              </div>
            )}


            {/* SUCCESS MESSAGE */}

            {success && (
              <div className="signup-message signup-success">
                {success}
              </div>
            )}


            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="signup-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="signup-spinner" />

                  Creating account...
                </>
              ) : (
                <>
                  Create Account

                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>


          {/* LOGIN LINK */}

          <div className="signup-login-link">

            Already have an account?

            <Link to="/login">
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;