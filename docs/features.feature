# CouplePlan App — Gherkin Feature Specifications
# Generated from source code analysis of /tmp/couplesapp-work/src
# Covers all features: Authentication, Partner Invitation, Dashboard, Goals,
# Budgets, Events, Tasks, Travels, and Profile

Feature: Authentication

  Background:
    Given the CouplePlan application is loaded

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "user@example.com" in the email field
    And I enter password "password123" in the password field
    And I click the "Sign In" button
    Then I should be redirected to the dashboard
    And I should see the dashboard title "Dashboard"

  Scenario: Login fails with invalid credentials
    Given I am on the login page
    When I enter email "wrong@example.com" in the email field
    And I enter password "wrongpassword" in the password field
    And I click the "Sign In" button
    Then I should see an error message
    And I should remain on the login page

  Scenario: Login shows loading state while authenticating
    Given I am on the login page
    When I enter valid credentials
    And I click the "Sign In" button
    Then I should see a loading spinner on the button

  Scenario: Successful signup creates a new account
    Given I am on the signup page
    When I enter name "John Doe" in the name field
    And I enter email "newuser@example.com" in the email field
    And I enter password "securepassword" in the password field
    And I click the "Sign Up" button
    Then I should be redirected to the dashboard
    And my profile should be created with name "John Doe"

  Scenario: Signup fails with existing email
    Given I am on the signup page
    When I enter name "Jane Doe" in the name field
    And I enter email "existing@example.com" in the email field
    And I enter password "password123" in the password field
    And I click the "Sign Up" button
    Then I should see an error message about the email already being in use

  Scenario: Signup navigates to login page
    Given I am on the signup page
    When I click the "Sign in" link
    Then I should be redirected to the login page

  Scenario: Login navigates to signup page
    Given I am on the login page
    When I click the "Sign up" link
    Then I should be redirected to the signup page

  Scenario: Successful logout
    Given I am logged in as "user@example.com"
    And I am on the profile page
    When I click the "Log Out" button
    Then I should be redirected to the login page
    And I should not be able to access the dashboard

  Scenario: Unauthenticated user redirected to login
    Given I am not logged in
    When I navigate to the dashboard
    Then I should be redirected to the login page

  Scenario: Authenticated user redirected from login to dashboard
    Given I am logged in
    When I navigate to the login page
    Then I should be automatically redirected to the dashboard


Feature: Partner Invitation

  Background:
    Given I am logged in as "alice@example.com"

  Scenario: Send a partner invitation via email
    Given I am on the invite partner page
    When I enter "bob@example.com" in the partner email field
    And I click the "Send Invitation" button
    Then I should see a success message "Invitation created successfully!"
    And an invitation record should be created in the database with status "pending"
    And I should see the invitation URL

  Scenario: Copy invitation link to clipboard
    Given I have successfully sent an invitation to "bob@example.com"
    When I click the copy link button
    Then the invitation URL should be copied to the clipboard
    And I should see a visual confirmation that the link was copied

  Scenario: Invite another partner after first invitation
    Given I have successfully sent an invitation
    When I click the "Invite Another Partner" button
    Then the form should reset
    And I should be able to enter a new partner email

  Scenario: Invitation form validation
    Given I am on the invite partner page
    When I click the "Send Invitation" button without entering an email
    Then the form should not be submitted
    And the email field should be required

  Scenario: Accept a partner invitation via unique token link
    Given I am logged in as "bob@example.com"
    And an invitation exists with token "abc123" from "alice@example.com"
    When I navigate to "/invitation/abc123"
    Then I should see the invitation details showing "alice@example.com" wants to connect
    And I should see the "Accept Invitation" button
    And I should see the "Decline" button

  Scenario: Successfully accept a partner invitation
    Given I am logged in as "bob@example.com"
    And I am on the invitation page for a pending invitation
    When I click the "Accept Invitation" button
    Then the invitation status should be updated to "accepted"
    And my profile's partner_id should be set to alice's user ID
    And alice's profile's partner_id should be set to my user ID
    And I should see a success "Connected!" message
    And I should be redirected to the dashboard after 2 seconds

  Scenario: Decline a partner invitation
    Given I am logged in as "bob@example.com"
    And I am on the invitation page for a pending invitation
    When I click the "Decline" button
    Then the invitation status should be updated to "rejected"
    And I should be redirected to the dashboard

  Scenario: View already-accepted invitation
    Given an invitation with token "abc123" has status "accepted"
    When I navigate to "/invitation/abc123"
    Then I should see an error "This invitation has already been accepted"

  Scenario: View already-rejected invitation
    Given an invitation with token "xyz789" has status "rejected"
    When I navigate to "/invitation/xyz789"
    Then I should see an error "This invitation has been rejected"

  Scenario: View invitation when not logged in
    Given I am not logged in
    And an invitation exists with token "abc123"
    When I navigate to "/invitation/abc123"
    Then I should see the invitation details
    And I should see "Log In" and "Sign Up" buttons
    And I should be able to navigate to login page with the invitation token preserved

  Scenario: View invalid or expired invitation
    Given no invitation exists with token "invalid-token"
    When I navigate to "/invitation/invalid-token"
    Then I should see an error "Invitation not found or has expired"


Feature: Dashboard

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the dashboard page

  Scenario: View dashboard with welcome message
    Then I should see "Dashboard" as the page title
    And I should see "Welcome back, alice@example.com!"
    And I should see the CouplePlan logo

  Scenario: View dashboard with partner connected
    Given I am connected to partner "bob@example.com" with name "Bob"
    When I view the dashboard
    Then I should see "Connected with Bob" next to the welcome message

  Scenario: View today's events on dashboard
    Given I have an event today titled "Dinner with family" at "19:00"
    When I view the dashboard
    Then I should see "Today's Events" section
    And I should see "Dinner with family" in the events list
    And I should see the time "19:00" next to the event

  Scenario: View empty today's events
    Given I have no events scheduled for today
    When I view the dashboard
    Then I should see "No events scheduled for today"
    And I should see an "Add an event" link

  Scenario: Navigate to Goals section from dashboard
    When I click on the "Goals" menu item
    Then I should be redirected to the goals page

  Scenario: Navigate to Budgets section from dashboard
    When I click on the "Budgets" menu item
    Then I should be redirected to the budgets page

  Scenario: Navigate to Events section from dashboard
    When I click on the "Events" menu item
    Then I should be redirected to the events page

  Scenario: Navigate to Travel section from dashboard
    When I click on the "Travel" menu item
    Then I should be redirected to the travel plans page

  Scenario: Navigate to Tasks section from dashboard
    When I click on the "Tasks" menu item
    Then I should be redirected to the tasks page

  Scenario: Navigate to Profile from dashboard
    When I click on the profile icon in the header
    Then I should be redirected to the profile page

  Scenario: View "Connect with Partner" CTA when no partner connected
    Given I have no partner connected
    When I view the dashboard
    Then I should see "Connect with Your Partner" section
    And I should see the "Invite Partner" button

  Scenario: View all events link from dashboard
    When I click "View All" in the today's events section
    Then I should be redirected to the events page


Feature: Goals

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the goals page

  Scenario: View empty goals list
    Given I have no goals created
    Then I should see "No goals yet" message
    And I should see the "Create Goal" button

  Scenario: Create a new goal
    When I click the "New Goal" button
    Then I should see the goal creation form
    When I enter "Buy a house" in the title field
    And I enter "Our dream home" in the description field
    And I select "financial" as the category
    And I enter "2026-12-31" as the target date
    And I click the "Create" button
    Then I should see "Buy a house" in the goals list
    And it should have the "Financial" category badge

  Scenario: View all goals with category badges
    Given I have goals in multiple categories
    When I view the goals page
    Then each goal should display its category badge with appropriate color

  Scenario: Update an existing goal
    Given I have a goal "Buy a house" with category "financial"
    When I click the edit button on "Buy a house"
    Then I should see the edit form pre-filled with goal details
    When I change the title to "Buy our dream house"
    And I click the "Update" button
    Then I should see "Buy our dream house" in the goals list

  Scenario: Delete a goal
    Given I have a goal "Buy a house"
    When I click the delete button on the goal
    And I confirm the deletion in the confirmation dialog
    Then the goal should be removed from the list

  Scenario: Cancel goal deletion
    Given I have a goal "Buy a house"
    When I click the delete button on the goal
    And I cancel the confirmation dialog
    Then the goal should remain in the list

  Scenario: Mark a goal as complete
    Given I have an incomplete goal "Save $10,000"
    When I click the check button on the goal
    Then the goal should appear with strikethrough text
    And the goal should be marked as complete
    And the check button should be highlighted

  Scenario: Mark a completed goal as incomplete
    Given I have a completed goal "Save $10,000"
    When I click the check button on the goal
    Then the goal should appear without strikethrough text
    And the goal should be marked as incomplete

  Scenario: Create goal with all category options
    When I click the "New Goal" button
    Then I should see category options: "Travel", "Financial", "Personal", "Home", "Other"

  Scenario: Close goal creation form without saving
    When I click the "New Goal" button
    And I click the "Cancel" button
    Then the form should close without creating a goal


Feature: Budgets

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the budgets page

  Scenario: View empty budgets list
    Given I have no budgets created
    Then I should see "No budgets yet" message
    And I should see the "Create Budget" button

  Scenario: Create a new budget
    When I click the "New Budget" button
    Then I should see the budget creation form
    When I enter "Groceries" in the category field
    And I enter "500" in the budget amount field
    And I enter "2026" in the year field
    And I click the "Create" button
    Then I should see the "Groceries" budget card
    And the budget amount should show "$500.00"

  Scenario: View budget progress bar
    Given I have a budget "Groceries" with amount $500 and spent $250
    When I view the budgets page
    Then I should see the progress bar at 50%
    And the progress bar should be green (under 80%)

  Scenario: View budget progress bar near limit
    Given I have a budget "Rent" with amount $1000 and spent $850
    When I view the budgets page
    Then the progress bar should be yellow/orange (80-99%)

  Scenario: View budget exceeding limit
    Given I have a budget "Vacation" with amount $500 and spent $600
    When I view the budgets page
    Then the progress bar should be red (over 100%)
    And I should see the amount "over" budget

  Scenario: Update an existing budget
    Given I have a budget "Groceries" with amount $500
    When I click the edit button on "Groceries"
    Then I should see the edit form pre-filled with budget details
    When I change the amount to "600"
    And I click the "Update" button
    Then the budget should show "$600.00"

  Scenario: Delete a budget
    Given I have a budget "Groceries"
    When I click the delete button on the budget
    And I confirm the deletion
    Then the budget should be removed from the list

  Scenario: Add an expense to a budget
    Given I have a budget "Groceries" with amount $500
    When I click "View Expenses" on the "Groceries" budget
    Then I should see the expenses modal
    When I enter "Milk and eggs" in the expense description field
    And I enter "25.50" in the expense amount field
    And I enter today's date in the expense date field
    And I click "Add Expense"
    Then the expense "Milk and eggs" should appear in the expenses list
    And the budget spent amount should increase by $25.50

  Scenario: View all expenses for a budget
    Given I have a budget "Groceries" with 3 expenses
    When I click "View Expenses" on the "Groceries" budget
    Then I should see all 3 expenses listed
    And each expense should show description, date, and amount

  Scenario: View expenses count on budget card
    Given I have a budget "Groceries" with 5 expenses
    When I view the budgets page
    Then I should see "View Expenses (5)" on the budget card


Feature: Events

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the events page

  Scenario: View empty events list
    Given I have no events created
    Then I should see "No events yet" message
    And I should see the "Create Event" button

  Scenario: Create a new event
    When I click the "New Event" button
    Then I should see the event creation form
    When I enter "Anniversary Dinner" in the title field
    And I enter "Special restaurant" in the description field
    And I enter "2026-06-15" in the date field
    And I enter "19:00" in the time field
    And I select "shared" as the event type
    And I click the "Create" button
    Then I should see "Anniversary Dinner" in the events list
    And it should show date "6/15/2026" and time "19:00"

  Scenario: View event type badges
    Given I have a "shared" event and a "personal" event
    When I view the events list
    Then the shared event should show a "Shared" badge
    And the personal event should show a "Personal" badge

  Scenario: View "Today" badge for today's events
    Given I have an event scheduled for today
    When I view the events list
    Then the event should have a "Today" badge

  Scenario: Filter events - show only today's events
    Given I have events in the past, today, and future
    When I select "Today" from the filter dropdown
    Then I should only see events scheduled for today

  Scenario: Filter events - show only upcoming events
    Given I have past and upcoming events
    When I select "Upcoming" from the filter dropdown
    Then I should only see future events

  Scenario: Filter events - show only past events
    Given I have past and upcoming events
    When I select "Past" from the filter dropdown
    Then I should only see past events

  Scenario: Filter events - show all events
    Given I have past and future events
    When I select "All Events" from the filter dropdown
    Then I should see all events

  Scenario: Edit an event
    Given I have an event "Anniversary Dinner"
    When I click the edit button on "Anniversary Dinner"
    Then I should see the edit form pre-filled with event details
    When I change the title to "Anniversary Brunch"
    And I click the "Update" button
    Then I should see "Anniversary Brunch" in the events list

  Scenario: Delete an event
    Given I have an event "Anniversary Dinner"
    When I click the delete button on the event
    And I confirm the deletion
    Then the event should be removed from the list

  Scenario: Select event color
    When I click the "New Event" button
    Then I should see color picker options
    When I select the teal color option
    Then the selected color should have a highlighted border

  Scenario: Close event form without saving
    When I click the "New Event" button
    And I click the X button to close the form
    Then the form should close without creating an event


Feature: Tasks

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the tasks page

  Scenario: View empty tasks list
    Given I have no tasks created
    Then I should see "No tasks yet" message
    And I should see the "Create Task" button

  Scenario: Create a new task
    When I click the "New Task" button
    Then I should see the task creation form
    When I enter "Buy groceries" in the title field
    And I enter "Milk, eggs, bread" in the description field
    And I select "home" as the category
    And I enter "2026-03-10" as the due date
    And I click the "Create" button
    Then I should see "Buy groceries" in the tasks list
    And it should show the "Home" category badge

  Scenario: View task with due date
    Given I have a task "Buy groceries" due "2026-03-10"
    When I view the tasks page
    Then I should see the due date "3/10/2026" next to the task

  Scenario: Complete a task
    Given I have an incomplete task "Buy groceries"
    When I click the completion circle on "Buy groceries"
    Then the task should appear with strikethrough text
    And the completion circle should be filled/checked
    And the task should be marked as completed in the database

  Scenario: Uncomplete a task
    Given I have a completed task "Buy groceries"
    When I click the completion circle on "Buy groceries"
    Then the task should appear without strikethrough text
    And the completion circle should be empty

  Scenario: Edit a task
    Given I have a task "Buy groceries"
    When I click the edit button on "Buy groceries"
    Then I should see the edit form pre-filled with task details
    When I change the title to "Buy weekly groceries"
    And I click the "Update" button
    Then I should see "Buy weekly groceries" in the tasks list

  Scenario: Delete a task
    Given I have a task "Buy groceries"
    When I click the delete button on the task
    And I confirm the deletion
    Then the task should be removed from the list

  Scenario: Filter tasks - show pending only
    Given I have both completed and pending tasks
    When I select "Pending" from the filter dropdown
    Then I should only see incomplete tasks

  Scenario: Filter tasks - show completed only
    Given I have both completed and pending tasks
    When I select "Completed" from the filter dropdown
    Then I should only see completed tasks

  Scenario: Filter tasks - show all tasks
    Given I have both completed and pending tasks
    When I select "All Tasks" from the filter dropdown
    Then I should see all tasks

  Scenario: Tasks sorted by completion then due date
    Given I have tasks with different completion states and due dates
    When I view the tasks page
    Then incomplete tasks should appear before completed tasks
    And within each group, tasks should be ordered by due date ascending

  Scenario: Create task with all category options
    When I click the "New Task" button
    Then I should see category options: "Home", "Work", "Personal", "Shared"


Feature: Travels

  Background:
    Given I am logged in as "alice@example.com"
    And I am on the travel plans page

  Scenario: View empty travel plans list
    Given I have no travel plans created
    Then I should see "No travel plans yet" message
    And I should see the "Plan a Trip" button

  Scenario: Create a new travel plan
    When I click the "New Trip" button
    Then I should see the trip creation form
    When I enter "Paris, France" in the destination field
    And I enter "Romantic getaway" in the description field
    And I enter "2026-07-01" as the start date
    And I enter "2026-07-14" as the end date
    And I enter "3000" as the estimated budget
    And I select "planning" as the status
    And I click the "Create" button
    Then I should see "Paris, France" in the travel plans list
    And it should show status "Planning"
    And it should show budget "$3000.00"

  Scenario: View travel plan date range
    Given I have a travel plan to "Paris, France" from "2026-07-01" to "2026-07-14"
    When I view the travels page
    Then I should see the date range "7/1/2026 - 7/14/2026"

  Scenario: View travel plan with only start date
    Given I have a travel plan with only a start date of "2026-07-01"
    When I view the travels page
    Then I should see the date "7/1/2026"

  Scenario: View travel plan with no dates
    Given I have a travel plan with no dates set
    When I view the travels page
    Then I should see "Dates not set"

  Scenario: View travel status badges
    Given I have travel plans in statuses "planning", "booked", and "completed"
    When I view the travels page
    Then each plan should show the correct status badge with appropriate color

  Scenario: Update travel plan status from planning to booked
    Given I have a travel plan to "Paris, France" with status "planning"
    When I click the edit button on "Paris, France"
    And I change the status to "booked"
    And I click the "Update" button
    Then the travel plan should show status "Booked"

  Scenario: Mark travel plan as completed
    Given I have a travel plan to "Paris, France" with status "booked"
    When I click the edit button on "Paris, France"
    And I change the status to "completed"
    And I click the "Update" button
    Then the travel plan should show status "Completed"

  Scenario: Edit a travel plan
    Given I have a travel plan to "Paris, France"
    When I click the edit button on "Paris, France"
    Then I should see the edit form pre-filled with travel details
    When I change the destination to "London, UK"
    And I click the "Update" button
    Then I should see "London, UK" in the travel plans list

  Scenario: Delete a travel plan
    Given I have a travel plan to "Paris, France"
    When I click the delete button on the plan
    And I confirm the deletion
    Then the travel plan should be removed from the list

  Scenario: Create travel plan without optional fields
    When I click the "New Trip" button
    And I enter "Tokyo, Japan" in the destination field only
    And I click the "Create" button
    Then I should see "Tokyo, Japan" with "Dates not set" and no budget shown


Feature: Profile

  Background:
    Given I am logged in as "alice@example.com" with name "Alice"
    And I am on the profile page

  Scenario: View own profile information
    Then I should see "Alice" as the profile name
    And I should see "alice@example.com" as the email
    And I should see the "Partner Information" section

  Scenario: View profile without partner connected
    Given I have no partner connected
    When I view the profile page
    Then I should see "Not connected to a partner"
    And I should see the "Invite Partner" button

  Scenario: View profile with partner connected
    Given I am connected to partner "Bob" with email "bob@example.com"
    When I view the profile page
    Then I should see partner's name "Bob" and email "bob@example.com" in the partner section
    And I should see the "Connected" status indicator
    And I should see the "Disconnect" button

  Scenario: Navigate to invite partner from profile
    Given I have no partner connected
    When I click the "Invite Partner" button
    Then I should be redirected to the invite partner page

  Scenario: Disconnect from partner
    Given I am connected to partner "Bob"
    When I click the "Disconnect" button
    And I confirm the disconnection in the dialog
    Then I should see a success message "Disconnected from Bob"
    And the partner section should show "Not connected to a partner"
    And my profile's partner_id should be null in the database
    And Bob's partner_id should also be null in the database

  Scenario: Cancel partner disconnection
    Given I am connected to partner "Bob"
    When I click the "Disconnect" button
    And I cancel the confirmation dialog
    Then I should remain connected to "Bob"

  Scenario: View pending invitations on profile
    Given I have received a pending invitation from "Charlie" at "charlie@example.com"
    When I view the profile page
    Then I should see the "Pending Invitations (1)" section
    And I should see "Charlie invited you" in the invitations list

  Scenario: Accept pending invitation from profile
    Given I have a pending invitation from "charlie@example.com"
    When I click the "Accept" button on the invitation
    Then the invitation should be accepted
    And the page should refresh to update the partner connection

  Scenario: Reject pending invitation from profile
    Given I have a pending invitation from "charlie@example.com"
    When I click the "Reject" button on the invitation
    Then the invitation should be removed from the pending list
    And the invitation status should be updated to "rejected"

  Scenario: Navigate back to dashboard from profile
    When I click "Back to Dashboard"
    Then I should be redirected to the dashboard

  Scenario: Logout from profile page
    When I click the "Log Out" button
    Then I should be redirected to the login page
    And my session should be cleared
