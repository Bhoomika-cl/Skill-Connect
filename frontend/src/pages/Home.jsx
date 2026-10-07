import {
  ArrowRight,
  Search,
  Sparkles,
  Cloud,
  Network,
  CheckCircle2,
  Database,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";


function Home() {
  return (
    <div className="home-page">

      <style>
        {`

          * {
            box-sizing: border-box;
          }

          .home-page {
            min-height: 100vh;
            background: #ffffff;
            color: #172033;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            overflow: hidden;
          }


          /* =====================================================
             NAVBAR
             ===================================================== */

          .home-navbar {
            height: 100px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 52px;
            background: #ffffff;
            border-bottom: 1px solid #edf0f5;
            position: relative;
            z-index: 10;
          }


          .home-brand {
            display: flex;
            align-items: center;
            gap: 14px;
            text-decoration: none;
          }


          .home-brand-logo {
            width: 54px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15px;
            background: #2864e8;
            color: #ffffff;
            font-size: 16px;
            font-weight: 800;
            box-shadow:
              0 8px 20px rgba(37, 99, 235, 0.18);
          }


          .home-brand-name {
            font-size: 25px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.8px;
            color: #172033;
          }


          .home-brand-name span {
            color: #2864e8;
          }


          .home-nav-right {
            display: flex;
            align-items: center;
            gap: 44px;
          }


          .home-nav-links {
            display: flex;
            align-items: center;
            gap: 46px;
          }


          .home-nav-link {
            color: #667085;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition:
              color 0.2s ease;
          }


          .home-nav-link:hover {
            color: #2864e8;
          }


          .home-signin {
            color: #273248;
            font-size: 16px;
            font-weight: 750;
            text-decoration: none;
            transition:
              color 0.2s ease;
          }


          .home-signin:hover {
            color: #2864e8;
          }


          .home-get-started {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 23px;
            border-radius: 12px;
            background: #2864e8;
            color: #ffffff;
            font-size: 16px;
            font-weight: 750;
            text-decoration: none;
            box-shadow:
              0 10px 25px rgba(37, 99, 235, 0.20);
            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }


          .home-get-started:hover {
            background: #1f56d1;
            transform: translateY(-2px);
          }


          /* =====================================================
             HERO
             ===================================================== */

          .home-hero {
            position: relative;
            min-height: calc(100vh - 100px);
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(480px, 0.9fr);
            align-items: center;
            gap: 35px;
            padding:
              70px 52px 65px;
            overflow: hidden;
          }


          /* Large background circle */

          .home-hero::after {
            content: "";
            position: absolute;
            width: 620px;
            height: 620px;
            right: -170px;
            top: -160px;
            border-radius: 50%;
            background:
              #f0f5ff;
            z-index: 0;
          }


          .home-hero-content {
            position: relative;
            z-index: 2;
            max-width: 790px;
          }


          /* =====================================================
             BADGE
             ===================================================== */

          .home-badge {
            width: fit-content;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 38px;
            padding:
              10px 18px;
            border:
              1px solid #d7e5ff;
            border-radius: 30px;
            background: #f8fbff;
            color: #2864e8;
            font-size: 15px;
            font-weight: 700;
          }


          .home-badge svg {
            width: 20px;
            height: 20px;
          }


          /* =====================================================
             HERO TITLE
             ===================================================== */

          .home-title {
            margin: 0;
            max-width: 770px;
            color: #172033;
            font-size: clamp(
              56px,
              5.5vw,
              86px
            );
            line-height: 1.04;
            font-weight: 800;
            letter-spacing: -4px;
          }


          .home-title .blue {
            color: #2864e8;
          }


          .home-description {
            max-width: 790px;
            margin:
              28px 0 0;
            color: #667085;
            font-size: 20px;
            line-height: 1.85;
            letter-spacing: 0.05px;
          }


          .home-actions {
            display: flex;
            align-items: center;
            gap: 17px;
            margin-top: 36px;
          }


          .home-primary-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            min-width: 190px;
            padding:
              16px 24px;
            border-radius: 11px;
            background: #2864e8;
            color: #ffffff;
            font-size: 15px;
            font-weight: 750;
            text-decoration: none;
            box-shadow:
              0 10px 25px rgba(37, 99, 235, 0.18);
            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }


          .home-primary-button:hover {
            background: #1f56d1;
            transform: translateY(-2px);
          }


          .home-secondary-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            min-width: 190px;
            padding:
              15px 24px;
            border:
              1px solid #dce3ed;
            border-radius: 11px;
            background: #ffffff;
            color: #344054;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            transition:
              border-color 0.2s ease,
              color 0.2s ease;
          }


          .home-secondary-button:hover {
            border-color: #2864e8;
            color: #2864e8;
          }


          /* =====================================================
             HERO VISUAL
             ===================================================== */

          .home-visual {
            position: relative;
            z-index: 2;
            min-height: 560px;
            display: flex;
            align-items: center;
            justify-content: center;
          }


          .visual-search-card {
            position: relative;
            width: min(100%, 610px);
            min-height: 480px;
            padding: 32px;
            margin-top: 30px;
            border:
              1px solid #e2e8f0;
            border-radius: 24px;
            background: #ffffff;
            box-shadow:
              0 25px 60px
              rgba(39, 62, 100, 0.10);
          }


          .visual-label {
            color: #8b96a8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }


          .visual-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 8px;
          }


          .visual-title {
            margin: 0;
            color: #172033;
            font-size: 24px;
            font-weight: 800;
          }


          .visual-search-icon {
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: #edf4ff;
            color: #2864e8;
          }


          .visual-search-box {
            height: 62px;
            display: flex;
            align-items: center;
            gap: 13px;
            margin-top: 28px;
            padding:
              0 18px;
            border:
              1px solid #dce4ef;
            border-radius: 13px;
            background: #ffffff;
          }


          .visual-search-box svg {
            color: #8c99ad;
          }


          .visual-search-text {
            color: #344054;
            font-size: 15px;
            font-weight: 600;
          }


          .visual-section-label {
            margin-top: 31px;
            padding-bottom: 13px;
            border-bottom:
              1px solid #edf0f5;
            color: #8b96a8;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.8px;
          }


          /* =====================================================
             PEOPLE
             ===================================================== */

          .visual-person {
            display: flex;
            align-items: center;
            gap: 15px;
            padding:
              18px 0;
            border-bottom:
              1px solid #edf0f5;
          }


          .visual-person:last-child {
            border-bottom: none;
          }


          .person-avatar {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 13px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
          }


          .avatar-blue {
            background: #3778ed;
          }


          .avatar-purple {
            background: #7839ed;
          }


          .avatar-green {
            background: #16a477;
          }


          .person-info {
            flex: 1;
          }


          .person-name {
            color: #172033;
            font-size: 15px;
            font-weight: 750;
          }


          .person-role {
            margin-top: 4px;
            color: #8b96a8;
            font-size: 11px;
          }


          .match-badge {
            display: flex;
            align-items: center;
            gap: 5px;
            padding:
              7px 10px;
            border-radius: 20px;
            background: #eefaf5;
            color: #16845f;
            font-size: 10px;
            font-weight: 750;
          }


          /* =====================================================
             FLOATING SKILL CARDS
             ===================================================== */

          .floating-skill {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 10px;
            padding:
              13px 17px;
            border:
              1px solid #e3e8f0;
            border-radius: 15px;
            background: #ffffff;
            box-shadow:
              0 12px 30px
              rgba(40, 62, 95, 0.10);
            z-index: 5;
          }


          .floating-skill.top {
            left: -5px;
            top: 5px;
          }


          .floating-skill.bottom {
            right: -25px;
            bottom: 5px;
          }


          .floating-icon {
            width: 39px;
            height: 39px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
            background: #edf4ff;
            color: #2864e8;
          }


          .floating-text-small {
            color: #8b96a8;
            font-size: 10px;
            font-weight: 600;
          }


          .floating-text-main {
            margin-top: 2px;
            color: #172033;
            font-size: 13px;
            font-weight: 800;
          }


          /* =====================================================
             RESPONSIVE
             ===================================================== */

          @media (max-width: 1200px) {

            .home-navbar {
              padding: 0 35px;
            }

            .home-hero {
              padding:
                55px 35px;
              grid-template-columns:
                minmax(0, 1fr)
                minmax(420px, 0.85fr);
            }

            .home-title {
              font-size:
                clamp(52px, 5.3vw, 72px);
            }

            .home-nav-links {
              gap: 25px;
            }

            .home-nav-right {
              gap: 25px;
            }

          }


          @media (max-width: 950px) {

            .home-navbar {
              height: 82px;
            }

            .home-nav-links {
              display: none;
            }

            .home-hero {
              min-height:
                calc(100vh - 82px);
              grid-template-columns:
                1fr;
              padding:
                55px 35px;
            }

            .home-hero-content {
              max-width:
                760px;
            }

            .home-title {
              max-width:
                800px;
            }

            .home-visual {
              min-height:
                480px;
            }

            .visual-search-card {
              max-width:
                600px;
            }

          }


          @media (max-width: 650px) {

            .home-navbar {
              padding:
                0 20px;
            }

            .home-brand-logo {
              width:
                45px;
              height:
                45px;
              border-radius:
                12px;
            }

            .home-brand-name {
              font-size:
                20px;
            }

            .home-signin {
              display:
                none;
            }

            .home-get-started {
              padding:
                12px 15px;
              font-size:
                13px;
            }

            .home-hero {
              padding:
                45px 20px;
            }

            .home-badge {
              font-size:
                12px;
            }

            .home-title {
              font-size:
                49px;
              letter-spacing:
                -2.5px;
            }

            .home-description {
              font-size:
                16px;
                line-height:
                1.7;
            }

            .home-actions {
              flex-direction:
                column;
              align-items:
                stretch;
            }

            .home-primary-button,
            .home-secondary-button {
              width:
                100%;
            }

            .home-visual {
              min-height:
                420px;
            }

            .visual-search-card {
              min-height:
                390px;
              padding:
                22px;
            }

            .visual-title {
              font-size:
                19px;
            }

            .floating-skill.top {
              left:
                -8px;
            }

            .floating-skill.bottom {
              right:
                -8px;
            }

          }

        `}
      </style>


      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className="home-navbar">


        <Link
          to="/"
          className="home-brand"
        >

          <div className="home-brand-logo">
            SC
          </div>

          <div className="home-brand-name">
            Skill<span>Connect</span>
          </div>

        </Link>


      </header>


      {/* =====================================================
          HERO
          This is the ONLY section on the Home page.
          ===================================================== */}

      <main className="home-hero">


        {/* ===================================================
            LEFT CONTENT
            =================================================== */}

        <section className="home-hero-content">


          <div className="home-badge">

            <Sparkles
              size={19}
            />

            Connect people with the skills you need

          </div>


          <h1 className="home-title">

            Find the right{" "}

            <span className="blue">
              skills.
            </span>

            <br />

            Find the right

            <br />

            <span className="blue">
              people.
            </span>

          </h1>


          <p className="home-description">

            SkillConnect makes it easy to discover
            employees with the skills and experience
            your team needs. Search skills, explore
            experience, and connect with the right
            people.

          </p>


          <div className="home-actions">

            <Link
              to="/signup"
              className="home-primary-button"
            >

              Get Started

              <ArrowRight
                size={18}
              />

            </Link>


            <Link
              to="/login"
              className="home-secondary-button"
            >

              Sign In

            </Link>

          </div>


        </section>


        {/* ===================================================
            RIGHT VISUAL
            =================================================== */}

        <section className="home-visual">


          {/* Floating Azure card */}

          <div className="floating-skill top">

            <div className="floating-icon">

              <Cloud
                size={20}
              />

            </div>

            <div>

              <div className="floating-text-small">
                Skill
              </div>

              <div className="floating-text-main">
                Azure
              </div>

            </div>

          </div>


          {/* Main search card */}

          <div className="visual-search-card">


            <div className="visual-label">
              Search Skills
            </div>


            <div className="visual-title-row">

              <h2 className="visual-title">
                Find people by skill
              </h2>


              <div className="visual-search-icon">

                <Search
                  size={26}
                />

              </div>

            </div>


            <div className="visual-search-box">

              <Search
                size={22}
              />

              <span className="visual-search-text">
                Azure
              </span>

            </div>


            <div className="visual-section-label">
              MATCHING EXPERTISE
            </div>


            {/* Person 1 */}

            <div className="visual-person">

              <div className="person-avatar avatar-blue">
                AK
              </div>


              <div className="person-info">

                <div className="person-name">
                  Azure Specialist
                </div>

                <div className="person-role">
                  Cloud & Infrastructure
                </div>

              </div>


              <div className="match-badge">

                <CheckCircle2
                  size={13}
                />

                Match

              </div>

            </div>


            {/* Person 2 */}

            <div className="visual-person">

              <div className="person-avatar avatar-purple">
                SP
              </div>


              <div className="person-info">

                <div className="person-name">
                  Cloud Engineer
                </div>

                <div className="person-role">
                  Azure & DevOps
                </div>

              </div>


              <div className="match-badge">

                <CheckCircle2
                  size={13}
                />

                Match

              </div>

            </div>


            {/* Person 3 */}

            <div className="visual-person">

              <div className="person-avatar avatar-green">
                DS
              </div>


              <div className="person-info">

                <div className="person-name">
                  Data Engineer
                </div>

                <div className="person-role">
                  Cloud & Data Analytics
                </div>

              </div>


              <div className="match-badge">

                <CheckCircle2
                  size={13}
                />

                Match

              </div>

            </div>


          </div>


          {/* Floating Projects card */}

          <div className="floating-skill bottom">

            <div className="floating-icon">

              <Network
                size={20}
              />

            </div>

            <div>

              <div className="floating-text-small">
                Connected through
              </div>

              <div className="floating-text-main">
                Projects
              </div>

            </div>

          </div>


        </section>


      </main>

    </div>
  );
}


export default Home;