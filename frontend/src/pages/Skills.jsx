import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import API from "../services/api";


function Skills() {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/api/skills/analytics"
      );

      setAnalytics(response.data);

    } catch (err) {
      console.error(
        "Unable to load skill analytics:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to load skill analytics."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadAnalytics();
  }, []);


  // ==========================================================
  // DATA
  // ==========================================================

  const totalEmployees =
    analytics?.total_employees || 0;

  const totalUniqueSkills =
    analytics?.total_unique_skills || 0;

  const totalSkillRecords =
    analytics?.total_skill_records || 0;


  const popularSkills =
    analytics?.popular_skills || [];


  const leastCommonSkills =
    analytics?.least_common_skills || [];


  const overallProficiency =
    analytics?.overall_proficiency || {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
      Expert: 0,
    };


  // ==========================================================
  // SEARCH
  // ==========================================================

  const normalizedSearch =
    searchTerm.trim().toLowerCase();


  const filteredPopularSkills =
    useMemo(() => {

      if (!normalizedSearch) {
        return popularSkills;
      }

      return popularSkills.filter(
        (skill) =>
          skill.skill_name
            ?.toLowerCase()
            .includes(normalizedSearch)
      );

    }, [
      popularSkills,
      normalizedSearch,
    ]);


  const filteredLeastCommonSkills =
    useMemo(() => {

      if (!normalizedSearch) {
        return leastCommonSkills;
      }

      return leastCommonSkills.filter(
        (skill) =>
          skill.skill_name
            ?.toLowerCase()
            .includes(normalizedSearch)
      );

    }, [
      leastCommonSkills,
      normalizedSearch,
    ]);


  // ==========================================================
  // MAX VALUES
  // ==========================================================

  const maxPopularUsers =
    popularSkills.length > 0
      ? Math.max(
          ...popularSkills.map(
            (skill) =>
              Number(skill.user_count) || 0
          )
        )
      : 1;


  const maxLeastCommonUsers =
    leastCommonSkills.length > 0
      ? Math.max(
          ...leastCommonSkills.map(
            (skill) =>
              Number(skill.user_count) || 0
          )
        )
      : 1;


  // ==========================================================
  // PROFICIENCY
  // ==========================================================

  const proficiencyData = [
    {
      name: "Beginner",
      value:
        Number(
          overallProficiency.Beginner
        ) || 0,
      className: "beginner",
    },
    {
      name: "Intermediate",
      value:
        Number(
          overallProficiency.Intermediate
        ) || 0,
      className: "intermediate",
    },
    {
      name: "Advanced",
      value:
        Number(
          overallProficiency.Advanced
        ) || 0,
      className: "advanced",
    },
    {
      name: "Expert",
      value:
        Number(
          overallProficiency.Expert
        ) || 0,
      className: "expert",
    },
  ];


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingIcon}>
            <RefreshCw
              size={30}
              style={styles.spin}
            />
          </div>

          <h2 style={styles.loadingTitle}>
            Loading Skills
          </h2>

          <p style={styles.loadingText}>
            Fetching skill analytics from MongoDB...
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <AlertCircle size={30} />
          </div>

          <h2 style={styles.errorTitle}>
            Unable to Load Skills
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <button
            type="button"
            onClick={loadAnalytics}
            style={styles.retryButton}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div style={styles.page}>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div style={styles.header}>

        <div>

          <div style={styles.titleRow}>

            <div style={styles.titleIcon}>
              <BarChart3 size={25} />
            </div>

            <div>
              <h1 style={styles.title}>
                Skills
              </h1>

              <p style={styles.subtitle}>
                Organization-wide skill analytics
                and employee expertise
              </p>
            </div>

          </div>

        </div>


        <button
          type="button"
          onClick={loadAnalytics}
          style={styles.refreshButton}
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div style={styles.summaryGrid}>

        <SummaryCard
          icon={<Award size={23} />}
          title="Total Skills"
          value={totalUniqueSkills}
          subtitle="Unique skills"
          className="blue"
        />

        <SummaryCard
          icon={<Users size={23} />}
          title="Employees"
          value={totalEmployees}
          subtitle="Registered employees"
          className="purple"
        />

        <SummaryCard
          icon={<BarChart3 size={23} />}
          title="Skill Assignments"
          value={totalSkillRecords}
          subtitle="Total skill records"
          className="orange"
        />

        <SummaryCard
          icon={<CheckCircle2 size={23} />}
          title="Skill Coverage"
          value={
            totalEmployees > 0
              ? `${Math.round(
                  (totalSkillRecords /
                    Math.max(
                      totalEmployees,
                      1
                    )) *
                    10
                ) / 10}`
              : "0"
          }
          subtitle="Average skills / employee"
          className="green"
        />

      </div>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div style={styles.searchCard}>

        <div style={styles.searchIcon}>
          <Search size={19} />
        </div>

        <input
          type="text"
          placeholder="Search for a skill..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          style={styles.searchInput}
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            style={styles.clearSearch}
          >
            Clear
          </button>
        )}

      </div>


      {/* =====================================================
          POPULAR + LEAST COMMON
      ====================================================== */}

      <div style={styles.analyticsGrid}>

        {/* ===================================================
            MOST POPULAR
        ==================================================== */}

        <AnalyticsCard
          icon={
            <TrendingUp
              size={23}
            />
          }
          iconClass="popularIcon"
          title="Most Popular Skills"
          subtitle={
            "Skills known by the highest number of users."
          }
        >

          {filteredPopularSkills.length === 0 ? (

            <EmptyState
              text={
                normalizedSearch
                  ? "No matching skills found."
                  : "No skills available."
              }
            />

          ) : (

            <div style={styles.skillList}>

              {filteredPopularSkills.map(
                (skill, index) => {

                  const userCount =
                    Number(
                      skill.user_count
                    ) || 0;

                  const percentage =
                    Number(
                      skill.percentage
                    ) || 0;

                  const barWidth =
                    maxPopularUsers > 0
                      ? (
                          userCount /
                          maxPopularUsers
                        ) * 100
                      : 0;

                  return (
                    <SkillRow
                      key={
                        skill.skill_name
                      }
                      rank={
                        index + 1
                      }
                      name={
                        skill.skill_name
                      }
                      userCount={
                        userCount
                      }
                      percentage={
                        percentage
                      }
                      barWidth={
                        barWidth
                      }
                      variant="popular"
                    />
                  );
                }
              )}

            </div>
          )}

        </AnalyticsCard>


        {/* ===================================================
            LEAST COMMON
        ==================================================== */}

        <AnalyticsCard
          icon={
            <TrendingDown
              size={23}
            />
          }
          iconClass="leastIcon"
          title="Least Common Skills"
          subtitle={
            "Skills known by the fewest number of users."
          }
        >

          {filteredLeastCommonSkills.length === 0 ? (

            <EmptyState
              text={
                normalizedSearch
                  ? "No matching skills found."
                  : "No skills available."
              }
            />

          ) : (

            <div style={styles.skillList}>

              {filteredLeastCommonSkills.map(
                (skill, index) => {

                  const userCount =
                    Number(
                      skill.user_count
                    ) || 0;

                  const percentage =
                    Number(
                      skill.percentage
                    ) || 0;

                  const barWidth =
                    maxLeastCommonUsers > 0
                      ? (
                          userCount /
                          maxLeastCommonUsers
                        ) * 100
                      : 0;

                  return (
                    <SkillRow
                      key={
                        skill.skill_name
                      }
                      rank={
                        index + 1
                      }
                      name={
                        skill.skill_name
                      }
                      userCount={
                        userCount
                      }
                      percentage={
                        percentage
                      }
                      barWidth={
                        barWidth
                      }
                      variant="least"
                    />
                  );
                }
              )}

            </div>
          )}

        </AnalyticsCard>

      </div>


      {/* =====================================================
          PROFICIENCY
      ====================================================== */}

      <div style={styles.proficiencyCard}>

        <div style={styles.sectionHeader}>

          <div style={styles.sectionIcon}>
            <Award size={22} />
          </div>

          <div>
            <h2 style={styles.sectionTitle}>
              Skill Proficiency
            </h2>

            <p style={styles.sectionSubtitle}>
              Distribution of employee skill
              proficiency levels
            </p>
          </div>

        </div>


        <div style={styles.proficiencyGrid}>

          {proficiencyData.map(
            (item) => {

              const total =
                proficiencyData.reduce(
                  (
                    sum,
                    current
                  ) =>
                    sum +
                    current.value,
                  0
                );

              const percentage =
                total > 0
                  ? Math.round(
                      (
                        item.value /
                        total
                      ) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={
                    item.name
                  }
                  style={
                    styles.proficiencyItem
                  }
                >

                  <div
                    style={
                      styles.proficiencyTop
                    }
                  >

                    <span
                      style={
                        styles.proficiencyName
                      }
                    >
                      {item.name}
                    </span>

                    <span
                      style={
                        styles.proficiencyValue
                      }
                    >
                      {item.value}
                    </span>

                  </div>

                  <div
                    style={
                      styles.proficiencyBarBackground
                    }
                  >

                    <div
                      className={
                        `proficiencyBar ${item.className}`
                      }
                      style={{
                        width:
                          `${percentage}%`,
                      }}
                    />

                  </div>

                  <span
                    style={
                      styles.proficiencyPercentage
                    }
                  >
                    {percentage}% of
                    skill records
                  </span>

                </div>
              );
            }
          )}

        </div>

      </div>


      {/* =====================================================
          INFORMATION NOTE
      ====================================================== */}

      <div style={styles.infoBox}>

        <div style={styles.infoIcon}>
          <AlertCircle size={19} />
        </div>

        <div>

          <strong style={styles.infoTitle}>
            How the skill analytics work
          </strong>

          <p style={styles.infoText}>
            Each skill is counted by the number
            of unique employees who have that
            skill. Most Popular Skills displays
            the highest-count skills. Least
            Common Skills displays only the
            skills tied for the lowest employee
            count. Percentages represent the
            percentage of registered employees
            who have each skill.
          </p>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  className,
}) {
  return (
    <div style={styles.summaryCard}>

      <div
        className={`summaryIcon ${className}`}
        style={styles.summaryIcon}
      >
        {icon}
      </div>

      <div style={styles.summaryContent}>

        <span style={styles.summaryTitle}>
          {title}
        </span>

        <strong style={styles.summaryValue}>
          {value}
        </strong>

        <span style={styles.summarySubtitle}>
          {subtitle}
        </span>

      </div>

    </div>
  );
}


// ============================================================
// ANALYTICS CARD
// ============================================================

function AnalyticsCard({
  icon,
  iconClass,
  title,
  subtitle,
  children,
}) {
  return (
    <div style={styles.analyticsCard}>

      <div style={styles.analyticsHeader}>

        <div
          className={iconClass}
          style={styles.analyticsIcon}
        >
          {icon}
        </div>

        <div>

          <h2 style={styles.analyticsTitle}>
            {title}
          </h2>

          <p style={styles.analyticsSubtitle}>
            {subtitle}
          </p>

        </div>

      </div>

      {children}

    </div>
  );
}


// ============================================================
// SKILL ROW
// ============================================================

function SkillRow({
  rank,
  name,
  userCount,
  percentage,
  barWidth,
  variant,
}) {
  return (
    <div style={styles.skillRow}>

      <div
        className={
          variant === "popular"
            ? "rankBadgePopular"
            : "rankBadgeLeast"
        }
        style={styles.rankBadge}
      >
        {rank}
      </div>


      <div style={styles.skillNameContainer}>

        <div style={styles.skillName}>
          {name}
        </div>

        <div style={styles.skillCoverage}>
          {percentage}% employee coverage
        </div>

      </div>


      <div style={styles.barContainer}>

        <div
          style={styles.barBackground}
        >

          <div
            className={
              variant === "popular"
                ? "popularBar"
                : "leastBar"
            }
            style={{
              ...styles.bar,
              width: `${Math.max(
                barWidth,
                userCount > 0
                  ? 4
                  : 0
              )}%`,
            }}
          />

        </div>

      </div>


      <div style={styles.userCount}>
        {userCount}
      </div>

    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  text,
}) {
  return (
    <div style={styles.emptyState}>

      <BarChart3
        size={28}
        style={styles.emptyIcon}
      />

      <span>
        {text}
      </span>

    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

  page: {
    minHeight: "100vh",
    padding: "32px 36px 48px",
    background:
      "linear-gradient(180deg, #f8fbff 0%, #ffffff 45%)",
    color: "#172033",
  },


  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
  },


  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },


  titleIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #e8f0ff, #f1eaff)",
    color: "#4f46e5",
  },


  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
    letterSpacing: "-0.7px",
  },


  subtitle: {
    margin: "6px 0 0",
    color: "#72809a",
    fontSize: "15px",
  },


  refreshButton: {
    border: "1px solid #dce4f0",
    background: "#ffffff",
    color: "#344054",
    borderRadius: "10px",
    padding: "11px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 700,
    boxShadow:
      "0 3px 12px rgba(24, 39, 75, 0.06)",
  },


  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },


  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f2",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 6px 20px rgba(31, 48, 85, 0.05)",
  },


  summaryIcon: {
    width: "48px",
    height: "48px",
    minWidth: "48px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  summaryContent: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },


  summaryTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#77839a",
  },


  summaryValue: {
    marginTop: "2px",
    fontSize: "27px",
    fontWeight: 800,
    color: "#182338",
  },


  summarySubtitle: {
    marginTop: "1px",
    fontSize: "12px",
    color: "#99a3b4",
  },


  searchCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f2",
    borderRadius: "14px",
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    marginBottom: "22px",
    boxShadow:
      "0 5px 18px rgba(31, 48, 85, 0.04)",
  },


  searchIcon: {
    color: "#8a96aa",
    display: "flex",
    alignItems: "center",
    marginRight: "10px",
  },


  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#172033",
    background: "transparent",
  },


  clearSearch: {
    border: "none",
    background: "#f2f5fa",
    color: "#56627a",
    borderRadius: "7px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },


  analyticsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },


  analyticsCard: {
    background: "#ffffff",
    border: "1px solid #dfe6f0",
    borderRadius: "20px",
    padding: "25px 28px 24px",
    boxShadow:
      "0 7px 25px rgba(31, 48, 85, 0.05)",
    minWidth: 0,
  },


  analyticsHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "28px",
  },


  analyticsIcon: {
    width: "48px",
    height: "48px",
    minWidth: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  analyticsTitle: {
    margin: "2px 0 0",
    fontSize: "23px",
    fontWeight: 800,
    color: "#172033",
  },


  analyticsSubtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#8290a7",
  },


  skillList: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
  },


  skillRow: {
    display: "grid",
    gridTemplateColumns:
      "40px minmax(125px, 150px) minmax(100px, 1fr) 35px",
    alignItems: "center",
    columnGap: "12px",
    minHeight: "48px",
  },


  rankBadge: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
  },


  skillNameContainer: {
    minWidth: 0,
  },


  skillName: {
    fontSize: "15px",
    fontWeight: 750,
    color: "#1c2940",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },


  skillCoverage: {
    marginTop: "4px",
    fontSize: "10px",
    color: "#9aa5b7",
    fontWeight: 600,
  },


  barContainer: {
    width: "100%",
  },


  barBackground: {
    width: "100%",
    height: "11px",
    background: "#edf1f6",
    borderRadius: "999px",
    overflow: "hidden",
  },


  bar: {
    height: "100%",
    borderRadius: "999px",
    transition:
      "width 0.4s ease",
  },


  userCount: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#1a263a",
    textAlign: "right",
  },


  proficiencyCard: {
    background: "#ffffff",
    border: "1px solid #dfe6f0",
    borderRadius: "20px",
    padding: "25px 28px",
    marginBottom: "24px",
    boxShadow:
      "0 7px 25px rgba(31, 48, 85, 0.05)",
  },


  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "25px",
  },


  sectionIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "13px",
    background: "#eef4ff",
    color: "#3867e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 800,
  },


  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#8490a5",
    fontSize: "13px",
  },


  proficiencyGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "24px",
  },


  proficiencyItem: {
    minWidth: 0,
  },


  proficiencyTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "9px",
  },


  proficiencyName: {
    fontSize: "13px",
    fontWeight: 750,
    color: "#344054",
  },


  proficiencyValue: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#172033",
  },


  proficiencyBarBackground: {
    width: "100%",
    height: "9px",
    borderRadius: "999px",
    background: "#edf1f6",
    overflow: "hidden",
  },


  proficiencyPercentage: {
    display: "block",
    marginTop: "6px",
    fontSize: "11px",
    color: "#96a0b1",
  },


  infoBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#f6f9ff",
    border: "1px solid #dfe9fb",
    borderRadius: "14px",
    padding: "16px 18px",
  },


  infoIcon: {
    color: "#4771d9",
    display: "flex",
    marginTop: "1px",
  },


  infoTitle: {
    display: "block",
    fontSize: "13px",
    color: "#31466e",
    marginBottom: "5px",
  },


  infoText: {
    margin: 0,
    color: "#71809a",
    fontSize: "12px",
    lineHeight: 1.6,
  },


  loadingContainer: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },


  loadingIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "#edf3ff",
    color: "#4f6fe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  spin: {
    animation:
      "skillConnectSpin 1s linear infinite",
  },


  loadingTitle: {
    margin: "18px 0 5px",
    fontSize: "20px",
  },


  loadingText: {
    margin: 0,
    color: "#8490a5",
    fontSize: "14px",
  },


  errorContainer: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },


  errorIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "#fff1f1",
    color: "#dc4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  errorTitle: {
    margin: "18px 0 6px",
    fontSize: "20px",
  },


  errorText: {
    margin: 0,
    color: "#8490a5",
    fontSize: "14px",
    maxWidth: "500px",
  },


  retryButton: {
    marginTop: "18px",
    border: "none",
    background: "#3f63d8",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
  },


  emptyState: {
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#8a96a9",
    fontSize: "13px",
  },


  emptyIcon: {
    color: "#b3bfd0",
  },
};


// ============================================================
// GLOBAL DYNAMIC CLASSES
// ============================================================

const styleElement =
  document.createElement("style");

styleElement.innerHTML = `

@keyframes skillConnectSpin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}


/* SUMMARY COLORS */

.summaryIcon.blue {
  background: #edf3ff;
  color: #3867e8;
}

.summaryIcon.purple {
  background: #f1edff;
  color: #7048df;
}

.summaryIcon.orange {
  background: #fff3e8;
  color: #ef751f;
}

.summaryIcon.green {
  background: #eafaf1;
  color: #20945d;
}


/* ANALYTICS ICONS */

.popularIcon {
  background: #eaf1ff;
  color: #2864e8;
}

.leastIcon {
  background: #fff4e8;
  color: #ef721e;
}


/* RANK BADGES */

.rankBadgePopular {
  background: #edf3ff;
  color: #2864e8;
}

.rankBadgeLeast {
  background: #fff4e8;
  color: #ef721e;
}


/* GRAPH BARS */

.popularBar {
  background:
    linear-gradient(
      90deg,
      #2864e8,
      #7c3aed
    );
}

.leastBar {
  background:
    linear-gradient(
      90deg,
      #ff923f,
      #ff711e
    );
}


/* PROFICIENCY BARS */

.proficiencyBar.beginner {
  background: #8ba4d9;
}

.proficiencyBar.intermediate {
  background: #5b7cdb;
}

.proficiencyBar.advanced {
  background: #7657d9;
}

.proficiencyBar.expert {
  background: #4d38b5;
}


/* RESPONSIVE */

@media (max-width: 1100px) {

  .summaryGrid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .analyticsGrid {
    grid-template-columns:
      1fr;
  }

  .proficiencyGrid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}


@media (max-width: 700px) {

  .summaryGrid {
    grid-template-columns:
      1fr;
  }

  .proficiencyGrid {
    grid-template-columns:
      1fr;
  }

  .skillRow {
    grid-template-columns:
      36px minmax(100px, 1fr) 80px 25px;
    column-gap: 8px;
  }

  .skillCoverage {
    display: none;
  }
}

`;

document.head.appendChild(
  styleElement
);


export default Skills;