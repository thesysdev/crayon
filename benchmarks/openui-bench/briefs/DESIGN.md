# Brief design

The 46 screen briefs in `briefs.mjs`, and the rules they were written under.
This file is the design record; the briefs themselves are frozen. Changing a
brief invalidates every raw generated against it, so any change means new raw
dirs and a full rerun.

## What the briefs measure

Failure rate versus screen complexity, where complexity is the number of
numbered requirements in the brief, known by construction. The model keeps
full structural freedom: requirements name content and intent, never
components or layout, so every mistake class stays live (wrong component
choice, bad props, broken references, hallucinated names).

## Prompt template (frozen)

Each scenario becomes this user message (system prompts are the official per-format
generators, untouched):

```
{context} Build a single screen for this. It must show:
1. {requirement}
...
N. {requirement}
Cover every numbered item.
```

Requirement count N is the scenario's complexity value. Bands:

| band | requirements | scenarios | label |
|---|---|---|---|
| B1 | 2–3 | 10 | glance |
| B2 | 4–6 | 10 | simple screen |
| B3 | 7–10 | 10 | working screen |
| B4 | 11–15 | 8 | dense screen |
| B5 | 16–20 | 8 | full workspace |

## Scenario authoring rules (enforced before sign-off)

1. Requirements name **content and intent only**. Never a component, never layout.
2. Banned (word-boundary, case-insensitive grep over this file's scenario section
   must return zero hits): every catalog component name plus common UI/layout nouns:
   `accordion, areachart, barchart, button, callout, card, chart, checkbox, chip,
   chips, col, datepicker, form, grid, header, icon, image, inline, input, list,
   metric, modal, option, picker, radio, row, column, scatter, section, segmented,
   select, slider, snippet, stack, stacked, steps, switch, tab, tabs, table, tag,
   text, textarea, toggle, side-by-side, dropdown, badge`.
3. Every requirement must be expressible with the 70-component catalog (reviewed by
   hand once at sign-off).
4. Interactive intents phrased as "a way to ..." so the model chooses the control.

## Scenarios (frozen set)

### B1: glance (2–3 requirements)

**b1-uptime** (2): Status page for the platform team.
1. current uptime percentage for the API this month
2. a short note on the most recent incident and when it was resolved

**b1-profile** (3): A person's page in the company directory.
1. the person's name and role
2. a short bio
3. a way to send them a message

**b1-invoice** (3): A freelancer's invoice view for a client.
1. the amount due and currency
2. the due date
3. a way to pay now

**b1-newsletter** (2): Signup page for a weekly product newsletter.
1. one sentence on what subscribers get
2. a way to enter an email address and subscribe

**b1-meeting** (3): A quick look at what is next on the calendar.
1. the next meeting's title and start time
2. who is attending
3. a way to join the call

**b1-revenue** (2): A shop owner checking in mid-morning.
1. revenue so far today
2. how that compares with the same time yesterday

**b1-task** (3): A personal focus view for one task.
1. the single most urgent task with its deadline
2. its current status
3. a way to mark it done

**b1-weather** (3): A morning weather brief.
1. current temperature and conditions for Bengaluru
2. the outlook for the next three days
3. sunrise and sunset times

**b1-order** (3): A customer checking a delivery.
1. where the package is right now
2. the estimated delivery date
3. a way to report a problem with the delivery

**b1-poll** (2): A team lunch poll.
1. the question "Where should we go for lunch on Friday?"
2. three restaurants the user can vote between

### B2: simple screen (4–6 requirements)

**b2-sales** (5): A founder's monthly sales check.
1. revenue this month
2. how revenue moved over the last six months
3. the three best-selling products with units sold for each
4. conversion percentage
5. a way to download the numbers

**b2-support** (5): A support lead's morning view.
1. how many tickets are open
2. average first-response time
3. the five most recent tickets with priority for each
4. a way to narrow to high-priority only
5. a way to open a new ticket

**b2-fitness** (4): A fitness app's daily summary.
1. step count today against the daily goal
2. calories burned
3. how workouts went over the past week
4. a way to log a new workout

**b2-job** (6): A job posting page for a design role.
1. the role title and team
2. a short role description
3. the main qualifications sought
4. the salary range
5. a way to apply with name, email and a resume link
6. a way to share the posting

**b2-cafe** (5): A cafe's menu screen.
1. drinks with prices
2. food with prices
3. today's special called out
4. a way to show vegetarian items only
5. opening hours

**b2-budget** (5): A personal budget check.
1. total spent this month against the budget
2. spending split by category
3. the single largest expense highlighted
4. a way to look at a different month
5. a way to add an expense

**b2-course** (6): A learner's course home.
1. course title and instructor
2. overall progress percentage
3. modules with completion status for each
4. the next lesson called out
5. the average learner rating
6. a way to continue learning

**b2-stock** (4): A store's low-inventory warning view.
1. items running low with remaining units for each
2. a way to reorder each item
3. the threshold that triggers this warning
4. a way to search items

**b2-standup** (5): A remote team's async standup.
1. each teammate with today's status update
2. anyone blocked called out
3. today's date
4. a way to post your own update
5. how many updates are still missing

**b2-event** (6): A conference landing screen.
1. event name, date and venue
2. the agenda with times
3. the speakers with one line on each
4. ticket tiers with prices
5. a way to register with name and email
6. days remaining until the event

### B3: working screen (7–10 requirements)

**b3-marketing** (8): A marketing manager's weekly dashboard.
1. site visitors over the last 30 days
2. conversion rate
3. the top five traffic sources with share for each
4. running campaigns with spend for each
5. the best performing campaign called out
6. a way to change the date range
7. email subscriber growth this month
8. a way to export the report

**b3-orders** (9): An e-commerce operations desk.
1. orders placed today
2. revenue today
3. average order value
4. recent orders with id, customer, total and status for each
5. a way to narrow by status
6. a way to search by customer name
7. refund rate this month
8. order volume across the past four weeks
9. a way to mark an order fulfilled

**b3-hr** (8): An HR lead's hiring overview.
1. current headcount
2. open roles with department for each
3. candidates at each pipeline stage
4. average time to hire
5. headcount split by department
6. interviews scheduled this week
7. attrition over the past six months
8. a way to open a new role

**b3-server** (8): An on-call engineer's service health view.
1. uptime this quarter
2. CPU and memory usage over the past 24 hours
3. error rate right now
4. open incidents with severity for each
5. a way to narrow to one region
6. the five slowest endpoints with latency for each
7. a way to set an alert threshold
8. a way to acknowledge an incident

**b3-crm** (9): A sales rep's account page.
1. account name and owner
2. total deal value
3. current deal stage
4. recent activity in order
5. contacts with role for each
6. open follow-ups with due dates
7. a way to jot a note
8. the renewal date with a warning if it is near
9. a way to log a call

**b3-clinic** (7): A clinic receptionist's day view.
1. today's appointments with times and patient names
2. how many patients are expected
3. no-show rate this month
4. which rooms are free right now
5. the next patient called out
6. a way to check a patient in
7. a way to move to another day

**b3-content** (8): An editor's content studio.
1. drafts with status for each
2. pieces published this week
3. the most-read article this month
4. readership over the past 30 days
5. a way to narrow by category
6. a way to schedule a piece with title and publish date
7. comments awaiting reply
8. a way to start a new draft

**b3-freight** (9): A logistics coordinator's board.
1. shipments in transit with origin, destination, ETA and status for each
2. delayed shipments called out
3. on-time percentage this month
4. volume split by carrier
5. a way to search by route
6. average cost per shipment
7. weekly volume across the past two months
8. a way to flag a shipment
9. when the numbers were last refreshed

**b3-finance** (7): A startup's month-end finance view.
1. cash on hand
2. monthly burn
3. months of runway
4. expenses split by category
5. transactions above 10,000 dollars this month
6. a way to look at a different month
7. a way to download the statement

**b3-learning** (8): A training platform's analytics.
1. active learners this week
2. course completion rate
3. average quiz score
4. courses ranked by enrollment
5. learners at risk of dropping out
6. a way to narrow to one cohort
7. engagement across the past eight weeks
8. a way to message a cohort

### B4: dense screen (11–15 requirements)

**b4-saas** (13): A SaaS company's admin overview.
1. monthly recurring revenue
2. annual recurring revenue
3. churn this month
4. new signups over the past 90 days
5. customers split by plan
6. the ten largest customers with seats and spend for each
7. accounts at risk with the reason for each
8. failed payments with a way to retry each
9. adoption of the three newest features
10. current NPS
11. a way to change the reporting period
12. seat utilization across the company
13. a way to invite another admin

**b4-hospital** (12): A hospital operations command view.
1. bed occupancy
2. current ER wait
3. admissions over the past two weeks
4. patients per department
5. staff on shift with role for each
6. critical patients called out
7. patients ready for discharge
8. today's operating room bookings
9. supplies running low
10. a way to file an incident
11. a way to look at another day
12. a way to request a patient transfer

**b4-retail** (12): A store manager's daily console.
1. sales today against target
2. foot traffic through the day
3. best sellers with units for each
4. items out of stock
5. who is on shift today
6. average basket size
7. returns this week
8. how each running promotion is doing
9. each register and whether it is open
10. a way to reorder an item
11. a way to view a different store
12. this week compared with last week

**b4-portfolio** (13): A PMO's project portfolio review.
1. active projects with owner, deadline and health for each
2. overdue milestones
3. budget spent against allocation per project
4. team utilization
5. risks with severity for each
6. deadlines in the next two weeks
7. delivery pace over the past six sprints
8. blocked work items
9. a one-line health summary of the portfolio
10. a way to look at a different quarter
11. a way to request more people for a project
12. a way to export the review
13. a way to archive a finished project

**b4-bank** (11): A personal banking home.
1. balances for checking, savings and credit
2. recent transactions with merchant and amount for each
3. spending split by category this month
4. bills due soon
5. progress toward the vacation savings goal
6. current credit score
7. a way to move money between accounts with an amount
8. a way to freeze the credit line
9. a way to pick a statement period
10. a way to manage what triggers alerts
11. a way to dispute a transaction

**b4-power** (12): A power network operator's console.
1. current electricity load on the network
2. how close the network is to capacity
3. generation split by source
4. each plant with output and status
5. outages with affected region for each
6. demand forecast for the next 24 hours
7. current price per megawatt hour
8. maintenance planned this month
9. live alerts as they arrive
10. a way to focus on one region
11. a way to order curtailment
12. emissions today

**b4-airline** (12): An airline hub operations desk.
1. on-time performance today
2. flights with number, route, gate and status for each
3. delayed flights called out
4. recent gate changes
5. crews available for reassignment
6. weather advisories at the hub
7. average passenger load today
8. connections at risk of being missed
9. a way to rebook affected passengers
10. a way to look at a different hub
11. cancellations today
12. average turnaround time

**b4-creator** (11): A creator's cross-platform studio.
1. follower total and growth over the past month
2. engagement rate
3. best posts this month with reach for each
4. audience split by platform
5. posts scheduled this week
6. the best hour to post based on history
7. comments waiting for a reply
8. earnings this month
9. pending collaboration requests
10. a way to schedule a post with caption and time
11. a way to narrow everything to one platform

### B5: full workspace (16–20 requirements)

**b5-exec** (18): A CEO's quarterly command view.
1. revenue
2. costs
3. profit
4. revenue over four quarters
5. costs over four quarters
6. budget by department against plan
7. headcount by department
8. top risks with owner for each
9. strategic initiatives with status for each
10. months of runway
11. sales pipeline value
12. win rate
13. customer count and churn
14. NPS
15. items for the next board meeting
16. a way to change the quarter
17. a way to focus on one region
18. a way to export the pack

**b5-city** (17): A city operations center.
1. congestion right now
2. transit punctuality
3. air quality by district
4. energy use over the past week
5. water use today
6. open incidents with location and severity for each
7. where emergency vehicles are deployed
8. parking availability downtown
9. public events this weekend
10. citizen reports as they come in
11. service request backlog
12. current weather
13. a way to focus on one district
14. a way to dispatch a crew
15. a way to send a public alert with a message
16. roadworks planned this month
17. infrastructure jobs due for maintenance

**b5-game** (16): A game studio's live-ops room.
1. players online right now
2. daily and monthly active players
3. revenue today
4. revenue per user
5. session length over the past two weeks
6. best-selling items with units for each
7. each server region and its health
8. crash rate by app version
9. live events running and upcoming
10. player reports awaiting review
11. ban appeals awaiting review
12. in-game currency inflation
13. results of the two running experiments
14. a way to draft patch notes
15. a way to focus on one region
16. a way to ship a hotfix

**b5-fund** (17): A trading desk's morning workspace.
1. portfolio value
2. profit and loss today
3. positions with ticker, size, entry and current price for each
4. exposure by sector
5. value at risk
6. today's biggest gainers and losers
7. instruments being watched with price for each
8. working orders
9. margin in use
10. market headlines with sentiment for each
11. economic releases this week
12. each strategy's return this year
13. drawdown over the past year
14. any risk limits close to breach
15. a way to rebalance
16. a way to place an order with ticker, side and quantity
17. a way to change the timeframe

**b5-university** (16): A university administrator's overview.
1. total enrollment and how it moved over five years
2. applications by program
3. acceptance rate
4. tuition revenue this year
5. how full each course offering is
6. teaching load by faculty member
7. students at academic risk
8. scholarship budget used against total
9. housing occupancy
10. campus events this month
11. alumni giving over the past four years
12. a way to focus on one department
13. this semester compared with last
14. waitlisted students per program
15. a way to approve a new course
16. a way to send a message to a student group

**b5-plant** (17): A factory floor supervisor's console.
1. overall equipment effectiveness
2. units produced against today's target
3. each production line with rate and status
4. defect rate over the past month
5. downtime split by cause
6. machines due for maintenance
7. stock of steel, resin and packaging
8. supplier deliveries due this week
9. each shift's output compared
10. safety incidents this year and days since the last
11. batches on quality hold
12. energy use today
13. open work orders with priority for each
14. a way to schedule maintenance with machine and date
15. a way to focus on one line
16. live andon alerts
17. a way to export the shift report

**b5-streaming** (16): A streaming service's operations room.
1. viewers watching right now
2. most-watched titles with hours for each
3. watch time over the past month
4. new subscribers against cancellations
5. performance by genre
6. buffering rate
7. delivery health by region
8. releases coming this month
9. licenses expiring soon
10. how often recommendations get clicked
11. searches that ended without playback
12. revenue split by plan
13. viewing split by device
14. a way to focus on one region
15. feature flags with state for each
16. a way to promote a title on the home screen

**b5-disaster** (18): An emergency response coordination center.
1. active incidents by zone with severity for each
2. an overall severity summary
3. vehicles, personnel and supplies available
4. shelters with capacity and occupancy for each
5. status of each evacuation route
6. the weather forecast for the next 48 hours
7. people rescued and casualties so far
8. volunteers on duty with assignment for each
9. donations received
10. aid requests awaiting action
11. each communication channel and whether it is up
12. roads closed
13. nearby hospitals with free beds for each
14. open tasks with assignee for each
15. a way to request more resources with type and quantity
16. a way to broadcast an update with a message
17. a way to focus on one zone
18. a way to file a situation report
## Generated file

`briefs.mjs` is the mechanical transform of the scenario set below (no
rewording): one entry per brief with name, band, requirement count, and the
assembled prompt text.
