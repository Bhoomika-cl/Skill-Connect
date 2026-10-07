import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

    const username = formData.username.trim();
    const password = formData.password;

    if (!username) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/api/auth/login", {
        username,
        password,
      });

      const responseData = response.data || {};

      const loggedInUser =
        responseData.user ||
        responseData.data ||
        responseData;

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      login(loggedInUser);

      setSuccess("Login successful. Redirecting...");

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        const detail = err.response.data?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => item.msg)
              .join(", ")
          );
        } else {
          setError(
            detail ||
              err.response.data?.message ||
              "Invalid username or password."
          );
        }
      } else if (err.request) {
        setError(
          "The backend did not respond. Make sure FastAPI is running."
        );
      } else {
        setError(
          err.message ||
            "Unable to sign in."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = `
    * {
      box-sizing: border-box;
    }

    .login-page {
      min-height: 100vh;
      display: flex;
      background: #ffffff;
      color: #172033;
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    /* ================================
       LEFT SIDE
       ================================ */

    .login-left {
      position: relative;
      width: 50%;
      min-height: 100vh;
      padding: 120px 8% 50px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: #ffffff;
    }

    /* ================================
       LOGO
       ================================ */

    .login-logo {
      position: absolute;
      top: 32px;
      left: 8%;

      display: flex;
      align-items: center;

      height: 40px;
      gap: 11px;

      text-decoration: none;

      line-height: 1;

      white-space: nowrap;
    }

    .login-logo-icon {
      width: 40px;
      height: 40px;

      flex-shrink: 0;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 10px;

      background: #2563eb;
      color: #ffffff;

      font-size: 11px;
      font-weight: 800;

      line-height: 1;

      box-shadow:
        0 8px 18px
        rgba(37, 99, 235, 0.16);
    }

    .login-logo-text {
      display: flex;
      align-items: center;

      color: #172033;

      font-size: 19px;
      font-weight: 760;

      letter-spacing: -0.6px;

      line-height: 1;

      white-space: nowrap;
    }

    .login-logo-text span {
      color: #2563eb;
    }

    /* ================================
       FORM
       ================================ */

    .login-form-wrapper {
      width: min(645px, 100%);
      margin-top: 0;
    }

    .login-welcome {
      margin-bottom: 42px;
    }

    /*
      IMPORTANT:
      There is intentionally NO
      "SKILLCONNECT" label here.
    */

    .login-welcome h1 {
      margin: 0;

      color: #172033;

      font-size: 48px;
      line-height: 1.1;

      font-weight: 780;

      letter-spacing: -1.8px;
    }

    .login-welcome p {
      max-width: 650px;

      margin: 15px 0 0;

      color: #7b8494;

      font-size: 17px;
      line-height: 1.65;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 19px;
    }

    .login-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .login-label {
      color: #172033;

      font-size: 14px;
      font-weight: 700;
    }

    .login-input-wrapper {
      position: relative;
    }

    .login-input-icon {
      position: absolute;

      left: 22px;
      top: 50%;

      transform: translateY(-50%);

      color: #98a2b3;

      pointer-events: none;
    }

    .login-input {
      width: 100%;
      height: 68px;

      padding:
        0 55px
        0 64px;

      border: 1px solid #dfe4ec;

      border-radius: 12px;

      outline: none;

      background: #ffffff;

      color: #273248;

      font-size: 16px;

      transition: 0.2s ease;
    }

    .login-input::placeholder {
      color: #a7afbd;
    }

    .login-input:focus {
      border-color: #6f9ef1;

      box-shadow:
        0 0 0 3px
        rgba(37, 99, 235, 0.09);
    }

    .login-password-button {
      position: absolute;

      right: 17px;
      top: 50%;

      transform: translateY(-50%);

      width: 35px;
      height: 35px;

      border: none;

      border-radius: 7px;

      display: flex;
      align-items: center;
      justify-content: center;

      background: transparent;

      color: #98a2b3;

      cursor: pointer;
    }

    .login-password-button:hover {
      background: #f4f6fa;
      color: #475467;
    }

    /* ================================
       OPTIONS
       ================================ */

    .login-options {
      display: flex;
      align-items: center;
      justify-content: space-between;

      margin-top: -2px;
    }

    .login-remember {
      display: inline-flex;
      align-items: center;
      gap: 9px;

      color: #667085;

      font-size: 13px;

      cursor: pointer;
    }

    .login-remember input {
      width: 20px;
      height: 20px;

      margin: 0;

      accent-color: #2563eb;

      cursor: pointer;
    }

    .login-forgot {
      border: none;

      padding: 0;

      background: transparent;

      color: #2563eb;

      font-size: 13px;

      font-weight: 700;

      cursor: pointer;
    }

    .login-forgot:hover {
      text-decoration: underline;
    }

    /* ================================
       MESSAGES
       ================================ */

    .login-message {
      padding: 13px 15px;

      border-radius: 9px;

      font-size: 13px;

      line-height: 1.5;
    }

    .login-error {
      border: 1px solid #f3c4c5;

      background: #fff5f5;

      color: #b42318;
    }

    .login-success {
      border: 1px solid #b7e4c7;

      background: #f0fdf4;

      color: #15803d;
    }

    /* ================================
       SIGN IN BUTTON
       ================================ */

    .login-submit {
      width: 100%;
      height: 58px;

      margin-top: 5px;

      border: none;

      border-radius: 10px;

      display: flex;
      align-items: center;
      justify-content: center;

      gap: 9px;

      background: #2563eb;

      color: #ffffff;

      font-size: 16px;
      font-weight: 750;

      cursor: pointer;

      box-shadow:
        0 8px 22px
        rgba(37, 99, 235, 0.18);

      transition: 0.2s ease;
    }

    .login-submit:hover {
      background: #1d4ed8;

      transform: translateY(-1px);
    }

    .login-submit:disabled {
      opacity: 0.7;

      cursor: not-allowed;

      transform: none;
    }

    .login-spinner {
      animation:
        login-spin 0.8s linear infinite;
    }

    @keyframes login-spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ================================
       DIVIDER
       ================================ */

    .login-divider {
      display: flex;
      align-items: center;

      gap: 13px;

      margin: 4px 0;
    }

    .login-divider-line {
      flex: 1;

      height: 1px;

      background: #e8ebf0;
    }

    .login-divider span {
      color: #98a2b3;

      font-size: 11px;
      font-weight: 600;
    }

    /* ================================
       SSO
       ================================ */

    .login-sso {
      width: 100%;
      height: 54px;

      border: 1px solid #dfe4ec;

      border-radius: 10px;

      display: flex;
      align-items: center;
      justify-content: center;

      gap: 10px;

      background: #ffffff;

      color: #344054;

      font-size: 13px;
      font-weight: 650;

      cursor: pointer;
    }

    .login-sso:hover {
      border-color: #c8d0dc;

      background: #fafbfd;
    }

    .login-microsoft-icon {
      width: 17px;
      height: 17px;

      display: grid;

      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;

      gap: 1px;
    }

    .login-microsoft-icon span:nth-child(1) {
      background: #f25022;
    }

    .login-microsoft-icon span:nth-child(2) {
      background: #7fba00;
    }

    .login-microsoft-icon span:nth-child(3) {
      background: #00a4ef;
    }

    .login-microsoft-icon span:nth-child(4) {
      background: #ffb900;
    }

    /* ================================
       SIGNUP
       ================================ */

    .login-signup {
      margin-top: 25px;

      text-align: center;

      color: #7b8494;

      font-size: 13px;
    }

    .login-signup a {
      color: #2563eb;

      font-weight: 700;

      text-decoration: none;
    }

    .login-signup a:hover {
      text-decoration: underline;
    }

    /* ================================
       RIGHT SIDE
       ================================ */

    .login-right {
      position: relative;

      width: 50%;
      min-height: 100vh;

      overflow: hidden;

      display: flex;
      align-items: center;
      justify-content: center;

      background:
        linear-gradient(
          145deg,
          #eaf2ff 0%,
          #f5f8ff 48%,
          #e8f4ff 100%
        );
    }

    .login-right::before {
      content: "";

      position: absolute;

      width: 520px;
      height: 520px;

      right: -170px;
      top: -170px;

      border-radius: 50%;

      background:
        rgba(96, 165, 250, 0.13);
    }

    .login-right::after {
      content: "";

      position: absolute;

      width: 430px;
      height: 430px;

      left: -200px;
      bottom: -180px;

      border-radius: 50%;

      background:
        rgba(139, 92, 246, 0.08);
    }

    .login-visual {
      position: relative;

      z-index: 2;

      width: min(700px, 82%);
    }

    .login-visual-heading {
      margin-bottom: 35px;

      text-align: center;
    }

    .login-visual-heading h2 {
      max-width: 590px;

      margin: 0 auto;

      color: #172033;

      font-size: 38px;

      line-height: 1.18;

      font-weight: 760;

      letter-spacing: -1.2px;
    }

    .login-visual-heading h2 span {
      color: #2563eb;
    }

    .login-visual-heading p {
      max-width: 520px;

      margin: 14px auto 0;

      color: #667085;

      font-size: 15px;

      line-height: 1.65;
    }

    /* ================================
       ILLUSTRATION
       ================================ */

    .login-illustration {
      position: relative;

      height: 390px;

      border-radius: 25px;

      overflow: hidden;

      background:
        linear-gradient(
          180deg,
          #ffffff 0%,
          #eef5ff 100%
        );

      border: 1px solid
        rgba(255, 255, 255, 0.9);

      box-shadow:
        0 25px 55px
        rgba(49, 75, 112, 0.12);
    }

    .visual-window {
      position: absolute;

      left: 60px;
      top: 42px;

      width: 245px;
      height: 160px;

      border: 9px solid #dce6f5;

      border-radius: 10px;

      background:
        linear-gradient(
          135deg,
          #cfe4ff,
          #eff7ff
        );
    }

    .visual-window::before {
      content: "";

      position: absolute;

      top: 50%;
      left: 0;
      right: 0;

      height: 3px;

      background: #dce6f5;
    }

    .visual-window::after {
      content: "";

      position: absolute;

      left: 50%;
      top: 0;
      bottom: 0;

      width: 3px;

      background: #dce6f5;
    }

    .visual-wall {
      position: absolute;

      right: 42px;
      top: 38px;

      width: 205px;
      height: 145px;

      border-radius: 9px;

      background: #f9fbff;

      border: 1px solid #e3eaf4;
    }

    .visual-wall-line {
      position: absolute;

      left: 30px;

      height: 3px;

      border-radius: 3px;

      background: #d8e4f4;
    }

    .visual-wall-line:nth-child(1) {
      top: 37px;
      width: 90px;
    }

    .visual-wall-line:nth-child(2) {
      top: 57px;
      width: 125px;
    }

    .visual-wall-line:nth-child(3) {
      top: 77px;
      width: 95px;
    }

    .visual-table {
      position: absolute;

      left: 90px;
      right: 90px;

      bottom: 62px;

      height: 15px;

      border-radius: 10px;

      background: #c7d6e9;

      box-shadow:
        0 9px 0 #aabbd0;
    }

    .visual-table-leg-left,
    .visual-table-leg-right {
      position: absolute;

      bottom: 0;

      width: 10px;
      height: 85px;

      border-radius: 6px;

      background: #aabbd0;
    }

    .visual-table-leg-left {
      left: 120px;
    }

    .visual-table-leg-right {
      right: 120px;
    }

    .visual-person-one {
      position: absolute;

      left: 140px;
      bottom: 76px;

      width: 82px;
      height: 155px;
    }

    .person-one-head {
      position: absolute;

      top: 0;
      left: 22px;

      width: 39px;
      height: 43px;

      border-radius: 48%;

      background: #c98968;
    }

    .person-one-hair {
      position: absolute;

      top: -3px;
      left: 17px;

      width: 48px;
      height: 30px;

      border-radius: 50%;

      background: #342d2b;
    }

    .person-one-body {
      position: absolute;

      left: 9px;
      top: 44px;

      width: 65px;
      height: 91px;

      border-radius: 25px 25px 8px 8px;

      background: #4f83d8;
    }

    .person-one-arm {
      position: absolute;

      top: 59px;
      right: -16px;

      width: 52px;
      height: 12px;

      border-radius: 10px;

      transform: rotate(-20deg);

      background: #c98968;
    }

    .visual-person-two {
      position: absolute;

      left: 310px;
      bottom: 76px;

      width: 84px;
      height: 165px;
    }

    .person-two-head {
      position: absolute;

      top: 0;
      left: 22px;

      width: 40px;
      height: 44px;

      border-radius: 50%;

      background: #a96e50;
    }

    .person-two-hair {
      position: absolute;

      top: -7px;
      left: 16px;

      width: 51px;
      height: 39px;

      border-radius: 50%;

      background: #272522;
    }

    .person-two-body {
      position: absolute;

      left: 10px;
      top: 46px;

      width: 66px;
      height: 98px;

      border-radius: 24px 24px 9px 9px;

      background: #4caa83;
    }

    .person-two-arm {
      position: absolute;

      top: 58px;
      left: -20px;

      width: 54px;
      height: 12px;

      border-radius: 10px;

      transform: rotate(20deg);

      background: #a96e50;
    }

    .visual-laptop {
      position: absolute;

      left: 270px;
      bottom: 91px;

      width: 104px;
      height: 61px;
    }

    .visual-laptop-screen {
      position: absolute;

      left: 12px;
      top: 0;

      width: 80px;
      height: 48px;

      border: 4px solid #64748b;

      border-radius: 5px 5px 2px 2px;

      background: #dceaff;
    }

    .visual-laptop-screen::after {
      content: "";

      position: absolute;

      left: 10px;
      top: 10px;

      width: 52px;
      height: 4px;

      border-radius: 4px;

      background: #82aef2;

      box-shadow:
        0 10px 0 #a7c3f2,
        0 20px 0 #c3d7f5;
    }

    .visual-laptop-base {
      position: absolute;

      bottom: 1px;
      left: 0;

      width: 104px;
      height: 8px;

      border-radius: 5px;

      background: #64748b;
    }

    .skill-bubble {
      position: absolute;

      z-index: 5;

      padding: 9px 14px;

      border-radius: 22px;

      background: #ffffff;

      font-size: 10px;
      font-weight: 750;

      box-shadow:
        0 8px 20px
        rgba(48, 70, 100, 0.1);

      border: 1px solid #e7edf5;
    }

    .skill-bubble-python {
      top: 55px;
      left: 330px;
      color: #2563eb;
    }

    .skill-bubble-react {
      top: 125px;
      right: 38px;
      color: #0891b2;
    }

    .skill-bubble-cloud {
      top: 220px;
      left: 35px;
      color: #7c3aed;
    }

    .skill-bubble-data {
      right: 30px;
      bottom: 105px;
      color: #159669;
    }

    .skill-bubble-ml {
      left: 55px;
      bottom: 45px;
      color: #db7a19;
    }

    .visual-profile-card {
      position: absolute;

      z-index: 6;

      right: 40px;
      bottom: 38px;

      width: 145px;

      padding: 13px;

      border-radius: 12px;

      background: #ffffff;

      box-shadow:
        0 10px 25px
        rgba(48, 70, 100, 0.12);
    }

    .visual-profile-top {
      display: flex;
      align-items: center;

      gap: 8px;
    }

    .visual-profile-avatar {
      width: 32px;
      height: 32px;

      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      background: #e8f0ff;

      color: #2563eb;

      font-size: 9px;
      font-weight: 800;
    }

    .visual-profile-name {
      display: flex;
      flex-direction: column;

      gap: 3px;
    }

    .visual-profile-name strong {
      color: #344054;

      font-size: 8px;
    }

    .visual-profile-name span {
      color: #98a2b3;

      font-size: 7px;
    }

    .visual-profile-line {
      width: 70%;

      height: 4px;

      margin-top: 9px;

      border-radius: 4px;

      background: #e8edf4;
    }

    .visual-profile-line.short {
      width: 45%;

      margin-top: 5px;
    }

    /* ================================
       RESPONSIVE
       ================================ */

    @media (max-width: 1000px) {
      .login-left {
        width: 55%;

        padding-left: 6%;
        padding-right: 6%;
      }

      .login-right {
        width: 45%;
      }

      .login-logo {
        left: 6%;
      }

      .login-visual {
        width: 88%;
      }

      .login-visual-heading h2 {
        font-size: 28px;
      }
    }

    @media (max-width: 800px) {
      .login-page {
        display: block;
      }

      .login-right {
        display: none;
      }

      .login-left {
        width: 100%;

        min-height: 100vh;

        padding:
          105px
          25px
          45px;
      }

      .login-logo {
        left: 25px;
        top: 28px;
      }

      .login-form-wrapper {
        width: min(650px, 100%);
      }
    }

    @media (max-width: 480px) {
      .login-left {
        padding-left: 20px;
        padding-right: 20px;
      }

      .login-logo {
        left: 20px;
      }

      .login-welcome h1 {
        font-size: 38px;
      }

      .login-welcome p {
        font-size: 14px;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <div className="login-page">

        {/* ==========================================
            LEFT SIDE
            ========================================== */}

        <section className="login-left">

          {/* ONLY ONE LOGO */}
          <Link
            to="/"
            className="login-logo"
          >
            <div className="login-logo-icon">
              SC
            </div>

            <div className="login-logo-text">
              Skill<span>Connect</span>
            </div>
          </Link>

          <div className="login-form-wrapper">

            {/* ======================================
                WELCOME TEXT
                ====================================== */}

            <div className="login-welcome">

              <h1>
                Welcome Back!
              </h1>

              <p>
                Sign in to your account to
                continue discovering skills,
                people and expertise across
                your organization.
              </p>

            </div>

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* USERNAME */}

              <div className="login-field">

                <label
                  htmlFor="username"
                  className="login-label"
                >
                  Username
                </label>

                <div className="login-input-wrapper">

                  <UserRound
                    className="login-input-icon"
                    size={20}
                  />

                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="login-input"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="login-field">

                <label
                  htmlFor="password"
                  className="login-label"
                >
                  Password
                </label>

                <div className="login-input-wrapper">

                  <LockKeyhole
                    className="login-input-icon"
                    size={20}
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    className="login-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-password-button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>

                </div>

              </div>

              {/* REMEMBER / FORGOT */}

              <div className="login-options">

                <label className="login-remember">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="login-forgot"
                  onClick={() =>
                    setError(
                      "Password reset is not connected yet."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              {/* ERROR */}

              {error && (
                <div className="login-message login-error">
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="login-message login-success">

                  <CheckCircle2
                    size={15}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "6px",
                    }}
                  />

                  {success}

                </div>
              )}

              {/* SIGN IN */}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="login-spinner"
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In

                    <ArrowRight
                      size={19}
                    />
                  </>
                )}

              </button>

              {/* DIVIDER */}

              <div className="login-divider">

                <div className="login-divider-line" />

                <span>
                  OR
                </span>

                <div className="login-divider-line" />

              </div>

              {/* COMPANY SSO */}

              <button
                type="button"
                className="login-sso"
                onClick={() =>
                  setError(
                    "Company SSO is not connected yet."
                  )
                }
              >

                <div className="login-microsoft-icon">

                  <span />
                  <span />
                  <span />
                  <span />

                </div>

                Sign in with Company SSO

              </button>

            </form>

            {/* SIGN UP */}

            <div className="login-signup">

              Don't have an account?{" "}

              <Link to="/signup">
                Create an account
              </Link>

            </div>

          </div>

        </section>

        {/* ==========================================
            RIGHT SIDE
            ========================================== */}

        <section className="login-right">

          <div className="login-visual">

            <div className="login-visual-heading">

              <h2>
                People with the right{" "}
                <span>skills</span>{" "}
                can do amazing things together.
              </h2>

              <p>
                Discover the expertise already
                available across your organization
                and connect with the people who can
                help your team grow.
              </p>

            </div>

            <div className="login-illustration">

              <div className="visual-window" />

              <div className="visual-wall">

                <div className="visual-wall-line" />
                <div className="visual-wall-line" />
                <div className="visual-wall-line" />

              </div>

              <div className="skill-bubble skill-bubble-python">
                Python
              </div>

              <div className="skill-bubble skill-bubble-react">
                React
              </div>

              <div className="skill-bubble skill-bubble-cloud">
                Cloud
              </div>

              <div className="skill-bubble skill-bubble-data">
                Data Analysis
              </div>

              <div className="skill-bubble skill-bubble-ml">
                Machine Learning
              </div>

              <div className="visual-table" />

              <div className="visual-table-leg-left" />

              <div className="visual-table-leg-right" />

              <div className="visual-person-one">

                <div className="person-one-head" />
                <div className="person-one-hair" />
                <div className="person-one-body" />
                <div className="person-one-arm" />

              </div>

              <div className="visual-person-two">

                <div className="person-two-head" />
                <div className="person-two-hair" />
                <div className="person-two-body" />
                <div className="person-two-arm" />

              </div>

              <div className="visual-laptop">

                <div className="visual-laptop-screen" />

                <div className="visual-laptop-base" />

              </div>

              <div className="visual-profile-card">

                <div className="visual-profile-top">

                  <div className="visual-profile-avatar">
                    SC
                  </div>

                  <div className="visual-profile-name">

                    <strong>
                      Skill Expert
                    </strong>

                    <span>
                      Available to connect
                    </span>

                  </div>

                </div>

                <div className="visual-profile-line" />

                <div className="visual-profile-line short" />

              </div>

            </div>

          </div>

        </section>

      </div>
    </>
  );
}

export default Login;