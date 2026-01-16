#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK
# (content preserved above in file)

#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Unhinged dating app with expanded Hinge-style profiles, red-flag-based matching, and chat."
backend:
  - task: "Expand user profile schema for Hinge-style identity, lifestyle, and match preferences"
    implemented: true
    working: false
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Added new optional fields (identity, lifestyle, match prefs) to UserProfile and ProfileUpdate, updated registration and Google session user docs. Needs endpoint regression testing."
  - task: "Light filtering in /api/discover based on basic prefs (age, gender)"
    implemented: false
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history: []
frontend:
  - task: "Expand ProfileSetup wizard with Hinge-style dropdowns and match preference inputs"
    implemented: true
    working: false
    file: "/app/frontend/src/pages/ProfileSetup.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Extended step 1 with name, gender, pronouns, sexuality, interested_in, city/country, lifestyle, and match preference inputs; wired to existing /api/profile update endpoint. Needs UI flow testing."
metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Expand user profile schema for Hinge-style identity, lifestyle, and match preferences"
    - "Expand ProfileSetup wizard with Hinge-style dropdowns and match preference inputs"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Please verify that registration + login + profile setup still work, and that new profile fields save and load correctly through /api/profile and the ProfileSetup UI. Focus on regressions around profile_complete routing and existing AI roast features (they still rely on red_flags and negative_qualities)."
