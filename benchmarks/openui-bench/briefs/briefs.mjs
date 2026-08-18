// 46 screen briefs in 5 size bands, generated from DESIGN.md. Existing briefs are frozen (a change invalidates every raw generated against them); append new briefs following DESIGN.md.
export const SCENARIOS = [
  {
    "name": "b1-uptime",
    "axis": "reqs",
    "band": "b1",
    "reqs": 2,
    "prompt": "Status page for the platform team. Build a single screen for this. It must show:\n1. current uptime percentage for the API this month\n2. a short note on the most recent incident and when it was resolved\nCover every numbered item."
  },
  {
    "name": "b1-profile",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A person's page in the company directory. Build a single screen for this. It must show:\n1. the person's name and role\n2. a short bio\n3. a way to send them a message\nCover every numbered item."
  },
  {
    "name": "b1-invoice",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A freelancer's invoice view for a client. Build a single screen for this. It must show:\n1. the amount due and currency\n2. the due date\n3. a way to pay now\nCover every numbered item."
  },
  {
    "name": "b1-newsletter",
    "axis": "reqs",
    "band": "b1",
    "reqs": 2,
    "prompt": "Signup page for a weekly product newsletter. Build a single screen for this. It must show:\n1. one sentence on what subscribers get\n2. a way to enter an email address and subscribe\nCover every numbered item."
  },
  {
    "name": "b1-meeting",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A quick look at what is next on the calendar. Build a single screen for this. It must show:\n1. the next meeting's title and start time\n2. who is attending\n3. a way to join the call\nCover every numbered item."
  },
  {
    "name": "b1-revenue",
    "axis": "reqs",
    "band": "b1",
    "reqs": 2,
    "prompt": "A shop owner checking in mid-morning. Build a single screen for this. It must show:\n1. revenue so far today\n2. how that compares with the same time yesterday\nCover every numbered item."
  },
  {
    "name": "b1-task",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A personal focus view for one task. Build a single screen for this. It must show:\n1. the single most urgent task with its deadline\n2. its current status\n3. a way to mark it done\nCover every numbered item."
  },
  {
    "name": "b1-weather",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A morning weather brief. Build a single screen for this. It must show:\n1. current temperature and conditions for Bengaluru\n2. the outlook for the next three days\n3. sunrise and sunset times\nCover every numbered item."
  },
  {
    "name": "b1-order",
    "axis": "reqs",
    "band": "b1",
    "reqs": 3,
    "prompt": "A customer checking a delivery. Build a single screen for this. It must show:\n1. where the package is right now\n2. the estimated delivery date\n3. a way to report a problem with the delivery\nCover every numbered item."
  },
  {
    "name": "b1-poll",
    "axis": "reqs",
    "band": "b1",
    "reqs": 2,
    "prompt": "A team lunch poll. Build a single screen for this. It must show:\n1. the question \"Where should we go for lunch on Friday?\"\n2. three restaurants the user can vote between\nCover every numbered item."
  },
  {
    "name": "b2-sales",
    "axis": "reqs",
    "band": "b2",
    "reqs": 5,
    "prompt": "A founder's monthly sales check. Build a single screen for this. It must show:\n1. revenue this month\n2. how revenue moved over the last six months\n3. the three best-selling products with units sold for each\n4. conversion percentage\n5. a way to download the numbers\nCover every numbered item."
  },
  {
    "name": "b2-support",
    "axis": "reqs",
    "band": "b2",
    "reqs": 5,
    "prompt": "A support lead's morning view. Build a single screen for this. It must show:\n1. how many tickets are open\n2. average first-response time\n3. the five most recent tickets with priority for each\n4. a way to narrow to high-priority only\n5. a way to open a new ticket\nCover every numbered item."
  },
  {
    "name": "b2-fitness",
    "axis": "reqs",
    "band": "b2",
    "reqs": 4,
    "prompt": "A fitness app's daily summary. Build a single screen for this. It must show:\n1. step count today against the daily goal\n2. calories burned\n3. how workouts went over the past week\n4. a way to log a new workout\nCover every numbered item."
  },
  {
    "name": "b2-job",
    "axis": "reqs",
    "band": "b2",
    "reqs": 6,
    "prompt": "A job posting page for a design role. Build a single screen for this. It must show:\n1. the role title and team\n2. a short role description\n3. the main qualifications sought\n4. the salary range\n5. a way to apply with name, email and a resume link\n6. a way to share the posting\nCover every numbered item."
  },
  {
    "name": "b2-cafe",
    "axis": "reqs",
    "band": "b2",
    "reqs": 5,
    "prompt": "A cafe's menu screen. Build a single screen for this. It must show:\n1. drinks with prices\n2. food with prices\n3. today's special called out\n4. a way to show vegetarian items only\n5. opening hours\nCover every numbered item."
  },
  {
    "name": "b2-budget",
    "axis": "reqs",
    "band": "b2",
    "reqs": 5,
    "prompt": "A personal budget check. Build a single screen for this. It must show:\n1. total spent this month against the budget\n2. spending split by category\n3. the single largest expense highlighted\n4. a way to look at a different month\n5. a way to add an expense\nCover every numbered item."
  },
  {
    "name": "b2-course",
    "axis": "reqs",
    "band": "b2",
    "reqs": 6,
    "prompt": "A learner's course home. Build a single screen for this. It must show:\n1. course title and instructor\n2. overall progress percentage\n3. modules with completion status for each\n4. the next lesson called out\n5. the average learner rating\n6. a way to continue learning\nCover every numbered item."
  },
  {
    "name": "b2-stock",
    "axis": "reqs",
    "band": "b2",
    "reqs": 4,
    "prompt": "A store's low-inventory warning view. Build a single screen for this. It must show:\n1. items running low with remaining units for each\n2. a way to reorder each item\n3. the threshold that triggers this warning\n4. a way to search items\nCover every numbered item."
  },
  {
    "name": "b2-standup",
    "axis": "reqs",
    "band": "b2",
    "reqs": 5,
    "prompt": "A remote team's async standup. Build a single screen for this. It must show:\n1. each teammate with today's status update\n2. anyone blocked called out\n3. today's date\n4. a way to post your own update\n5. how many updates are still missing\nCover every numbered item."
  },
  {
    "name": "b2-event",
    "axis": "reqs",
    "band": "b2",
    "reqs": 6,
    "prompt": "A conference landing screen. Build a single screen for this. It must show:\n1. event name, date and venue\n2. the agenda with times\n3. the speakers with one line on each\n4. ticket tiers with prices\n5. a way to register with name and email\n6. days remaining until the event\nCover every numbered item."
  },
  {
    "name": "b3-marketing",
    "axis": "reqs",
    "band": "b3",
    "reqs": 8,
    "prompt": "A marketing manager's weekly dashboard. Build a single screen for this. It must show:\n1. site visitors over the last 30 days\n2. conversion rate\n3. the top five traffic sources with share for each\n4. running campaigns with spend for each\n5. the best performing campaign called out\n6. a way to change the date range\n7. email subscriber growth this month\n8. a way to export the report\nCover every numbered item."
  },
  {
    "name": "b3-orders",
    "axis": "reqs",
    "band": "b3",
    "reqs": 9,
    "prompt": "An e-commerce operations desk. Build a single screen for this. It must show:\n1. orders placed today\n2. revenue today\n3. average order value\n4. recent orders with id, customer, total and status for each\n5. a way to narrow by status\n6. a way to search by customer name\n7. refund rate this month\n8. order volume across the past four weeks\n9. a way to mark an order fulfilled\nCover every numbered item."
  },
  {
    "name": "b3-hr",
    "axis": "reqs",
    "band": "b3",
    "reqs": 8,
    "prompt": "An HR lead's hiring overview. Build a single screen for this. It must show:\n1. current headcount\n2. open roles with department for each\n3. candidates at each pipeline stage\n4. average time to hire\n5. headcount split by department\n6. interviews scheduled this week\n7. attrition over the past six months\n8. a way to open a new role\nCover every numbered item."
  },
  {
    "name": "b3-server",
    "axis": "reqs",
    "band": "b3",
    "reqs": 8,
    "prompt": "An on-call engineer's service health view. Build a single screen for this. It must show:\n1. uptime this quarter\n2. CPU and memory usage over the past 24 hours\n3. error rate right now\n4. open incidents with severity for each\n5. a way to narrow to one region\n6. the five slowest endpoints with latency for each\n7. a way to set an alert threshold\n8. a way to acknowledge an incident\nCover every numbered item."
  },
  {
    "name": "b3-crm",
    "axis": "reqs",
    "band": "b3",
    "reqs": 9,
    "prompt": "A sales rep's account page. Build a single screen for this. It must show:\n1. account name and owner\n2. total deal value\n3. current deal stage\n4. recent activity in order\n5. contacts with role for each\n6. open follow-ups with due dates\n7. a way to jot a note\n8. the renewal date with a warning if it is near\n9. a way to log a call\nCover every numbered item."
  },
  {
    "name": "b3-clinic",
    "axis": "reqs",
    "band": "b3",
    "reqs": 7,
    "prompt": "A clinic receptionist's day view. Build a single screen for this. It must show:\n1. today's appointments with times and patient names\n2. how many patients are expected\n3. no-show rate this month\n4. which rooms are free right now\n5. the next patient called out\n6. a way to check a patient in\n7. a way to move to another day\nCover every numbered item."
  },
  {
    "name": "b3-content",
    "axis": "reqs",
    "band": "b3",
    "reqs": 8,
    "prompt": "An editor's content studio. Build a single screen for this. It must show:\n1. drafts with status for each\n2. pieces published this week\n3. the most-read article this month\n4. readership over the past 30 days\n5. a way to narrow by category\n6. a way to schedule a piece with title and publish date\n7. comments awaiting reply\n8. a way to start a new draft\nCover every numbered item."
  },
  {
    "name": "b3-freight",
    "axis": "reqs",
    "band": "b3",
    "reqs": 9,
    "prompt": "A logistics coordinator's board. Build a single screen for this. It must show:\n1. shipments in transit with origin, destination, ETA and status for each\n2. delayed shipments called out\n3. on-time percentage this month\n4. volume split by carrier\n5. a way to search by route\n6. average cost per shipment\n7. weekly volume across the past two months\n8. a way to flag a shipment\n9. when the numbers were last refreshed\nCover every numbered item."
  },
  {
    "name": "b3-finance",
    "axis": "reqs",
    "band": "b3",
    "reqs": 7,
    "prompt": "A startup's month-end finance view. Build a single screen for this. It must show:\n1. cash on hand\n2. monthly burn\n3. months of runway\n4. expenses split by category\n5. transactions above 10,000 dollars this month\n6. a way to look at a different month\n7. a way to download the statement\nCover every numbered item."
  },
  {
    "name": "b3-learning",
    "axis": "reqs",
    "band": "b3",
    "reqs": 8,
    "prompt": "A training platform's analytics. Build a single screen for this. It must show:\n1. active learners this week\n2. course completion rate\n3. average quiz score\n4. courses ranked by enrollment\n5. learners at risk of dropping out\n6. a way to narrow to one cohort\n7. engagement across the past eight weeks\n8. a way to message a cohort\nCover every numbered item."
  },
  {
    "name": "b4-saas",
    "axis": "reqs",
    "band": "b4",
    "reqs": 13,
    "prompt": "A SaaS company's admin overview. Build a single screen for this. It must show:\n1. monthly recurring revenue\n2. annual recurring revenue\n3. churn this month\n4. new signups over the past 90 days\n5. customers split by plan\n6. the ten largest customers with seats and spend for each\n7. accounts at risk with the reason for each\n8. failed payments with a way to retry each\n9. adoption of the three newest features\n10. current NPS\n11. a way to change the reporting period\n12. seat utilization across the company\n13. a way to invite another admin\nCover every numbered item."
  },
  {
    "name": "b4-hospital",
    "axis": "reqs",
    "band": "b4",
    "reqs": 12,
    "prompt": "A hospital operations command view. Build a single screen for this. It must show:\n1. bed occupancy\n2. current ER wait\n3. admissions over the past two weeks\n4. patients per department\n5. staff on shift with role for each\n6. critical patients called out\n7. patients ready for discharge\n8. today's operating room bookings\n9. supplies running low\n10. a way to file an incident\n11. a way to look at another day\n12. a way to request a patient transfer\nCover every numbered item."
  },
  {
    "name": "b4-retail",
    "axis": "reqs",
    "band": "b4",
    "reqs": 12,
    "prompt": "A store manager's daily console. Build a single screen for this. It must show:\n1. sales today against target\n2. foot traffic through the day\n3. best sellers with units for each\n4. items out of stock\n5. who is on shift today\n6. average basket size\n7. returns this week\n8. how each running promotion is doing\n9. each register and whether it is open\n10. a way to reorder an item\n11. a way to view a different store\n12. this week compared with last week\nCover every numbered item."
  },
  {
    "name": "b4-portfolio",
    "axis": "reqs",
    "band": "b4",
    "reqs": 13,
    "prompt": "A PMO's project portfolio review. Build a single screen for this. It must show:\n1. active projects with owner, deadline and health for each\n2. overdue milestones\n3. budget spent against allocation per project\n4. team utilization\n5. risks with severity for each\n6. deadlines in the next two weeks\n7. delivery pace over the past six sprints\n8. blocked work items\n9. a one-line health summary of the portfolio\n10. a way to look at a different quarter\n11. a way to request more people for a project\n12. a way to export the review\n13. a way to archive a finished project\nCover every numbered item."
  },
  {
    "name": "b4-bank",
    "axis": "reqs",
    "band": "b4",
    "reqs": 11,
    "prompt": "A personal banking home. Build a single screen for this. It must show:\n1. balances for checking, savings and credit\n2. recent transactions with merchant and amount for each\n3. spending split by category this month\n4. bills due soon\n5. progress toward the vacation savings goal\n6. current credit score\n7. a way to move money between accounts with an amount\n8. a way to freeze the credit line\n9. a way to pick a statement period\n10. a way to manage what triggers alerts\n11. a way to dispute a transaction\nCover every numbered item."
  },
  {
    "name": "b4-power",
    "axis": "reqs",
    "band": "b4",
    "reqs": 12,
    "prompt": "A power network operator's console. Build a single screen for this. It must show:\n1. current electricity load on the network\n2. how close the network is to capacity\n3. generation split by source\n4. each plant with output and status\n5. outages with affected region for each\n6. demand forecast for the next 24 hours\n7. current price per megawatt hour\n8. maintenance planned this month\n9. live alerts as they arrive\n10. a way to focus on one region\n11. a way to order curtailment\n12. emissions today\nCover every numbered item."
  },
  {
    "name": "b4-airline",
    "axis": "reqs",
    "band": "b4",
    "reqs": 12,
    "prompt": "An airline hub operations desk. Build a single screen for this. It must show:\n1. on-time performance today\n2. flights with number, route, gate and status for each\n3. delayed flights called out\n4. recent gate changes\n5. crews available for reassignment\n6. weather advisories at the hub\n7. average passenger load today\n8. connections at risk of being missed\n9. a way to rebook affected passengers\n10. a way to look at a different hub\n11. cancellations today\n12. average turnaround time\nCover every numbered item."
  },
  {
    "name": "b4-creator",
    "axis": "reqs",
    "band": "b4",
    "reqs": 11,
    "prompt": "A creator's cross-platform studio. Build a single screen for this. It must show:\n1. follower total and growth over the past month\n2. engagement rate\n3. best posts this month with reach for each\n4. audience split by platform\n5. posts scheduled this week\n6. the best hour to post based on history\n7. comments waiting for a reply\n8. earnings this month\n9. pending collaboration requests\n10. a way to schedule a post with caption and time\n11. a way to narrow everything to one platform\nCover every numbered item."
  },
  {
    "name": "b5-exec",
    "axis": "reqs",
    "band": "b5",
    "reqs": 18,
    "prompt": "A CEO's quarterly command view. Build a single screen for this. It must show:\n1. revenue\n2. costs\n3. profit\n4. revenue over four quarters\n5. costs over four quarters\n6. budget by department against plan\n7. headcount by department\n8. top risks with owner for each\n9. strategic initiatives with status for each\n10. months of runway\n11. sales pipeline value\n12. win rate\n13. customer count and churn\n14. NPS\n15. items for the next board meeting\n16. a way to change the quarter\n17. a way to focus on one region\n18. a way to export the pack\nCover every numbered item."
  },
  {
    "name": "b5-city",
    "axis": "reqs",
    "band": "b5",
    "reqs": 17,
    "prompt": "A city operations center. Build a single screen for this. It must show:\n1. congestion right now\n2. transit punctuality\n3. air quality by district\n4. energy use over the past week\n5. water use today\n6. open incidents with location and severity for each\n7. where emergency vehicles are deployed\n8. parking availability downtown\n9. public events this weekend\n10. citizen reports as they come in\n11. service request backlog\n12. current weather\n13. a way to focus on one district\n14. a way to dispatch a crew\n15. a way to send a public alert with a message\n16. roadworks planned this month\n17. infrastructure jobs due for maintenance\nCover every numbered item."
  },
  {
    "name": "b5-game",
    "axis": "reqs",
    "band": "b5",
    "reqs": 16,
    "prompt": "A game studio's live-ops room. Build a single screen for this. It must show:\n1. players online right now\n2. daily and monthly active players\n3. revenue today\n4. revenue per user\n5. session length over the past two weeks\n6. best-selling items with units for each\n7. each server region and its health\n8. crash rate by app version\n9. live events running and upcoming\n10. player reports awaiting review\n11. ban appeals awaiting review\n12. in-game currency inflation\n13. results of the two running experiments\n14. a way to draft patch notes\n15. a way to focus on one region\n16. a way to ship a hotfix\nCover every numbered item."
  },
  {
    "name": "b5-fund",
    "axis": "reqs",
    "band": "b5",
    "reqs": 17,
    "prompt": "A trading desk's morning workspace. Build a single screen for this. It must show:\n1. portfolio value\n2. profit and loss today\n3. positions with ticker, size, entry and current price for each\n4. exposure by sector\n5. value at risk\n6. today's biggest gainers and losers\n7. instruments being watched with price for each\n8. working orders\n9. margin in use\n10. market headlines with sentiment for each\n11. economic releases this week\n12. each strategy's return this year\n13. drawdown over the past year\n14. any risk limits close to breach\n15. a way to rebalance\n16. a way to place an order with ticker, side and quantity\n17. a way to change the timeframe\nCover every numbered item."
  },
  {
    "name": "b5-university",
    "axis": "reqs",
    "band": "b5",
    "reqs": 16,
    "prompt": "A university administrator's overview. Build a single screen for this. It must show:\n1. total enrollment and how it moved over five years\n2. applications by program\n3. acceptance rate\n4. tuition revenue this year\n5. how full each course offering is\n6. teaching load by faculty member\n7. students at academic risk\n8. scholarship budget used against total\n9. housing occupancy\n10. campus events this month\n11. alumni giving over the past four years\n12. a way to focus on one department\n13. this semester compared with last\n14. waitlisted students per program\n15. a way to approve a new course\n16. a way to send a message to a student group\nCover every numbered item."
  },
  {
    "name": "b5-plant",
    "axis": "reqs",
    "band": "b5",
    "reqs": 17,
    "prompt": "A factory floor supervisor's console. Build a single screen for this. It must show:\n1. overall equipment effectiveness\n2. units produced against today's target\n3. each production line with rate and status\n4. defect rate over the past month\n5. downtime split by cause\n6. machines due for maintenance\n7. stock of steel, resin and packaging\n8. supplier deliveries due this week\n9. each shift's output compared\n10. safety incidents this year and days since the last\n11. batches on quality hold\n12. energy use today\n13. open work orders with priority for each\n14. a way to schedule maintenance with machine and date\n15. a way to focus on one line\n16. live andon alerts\n17. a way to export the shift report\nCover every numbered item."
  },
  {
    "name": "b5-streaming",
    "axis": "reqs",
    "band": "b5",
    "reqs": 16,
    "prompt": "A streaming service's operations room. Build a single screen for this. It must show:\n1. viewers watching right now\n2. most-watched titles with hours for each\n3. watch time over the past month\n4. new subscribers against cancellations\n5. performance by genre\n6. buffering rate\n7. delivery health by region\n8. releases coming this month\n9. licenses expiring soon\n10. how often recommendations get clicked\n11. searches that ended without playback\n12. revenue split by plan\n13. viewing split by device\n14. a way to focus on one region\n15. feature flags with state for each\n16. a way to promote a title on the home screen\nCover every numbered item."
  },
  {
    "name": "b5-disaster",
    "axis": "reqs",
    "band": "b5",
    "reqs": 18,
    "prompt": "An emergency response coordination center. Build a single screen for this. It must show:\n1. active incidents by zone with severity for each\n2. an overall severity summary\n3. vehicles, personnel and supplies available\n4. shelters with capacity and occupancy for each\n5. status of each evacuation route\n6. the weather forecast for the next 48 hours\n7. people rescued and casualties so far\n8. volunteers on duty with assignment for each\n9. donations received\n10. aid requests awaiting action\n11. each communication channel and whether it is up\n12. roads closed\n13. nearby hospitals with free beds for each\n14. open tasks with assignee for each\n15. a way to request more resources with type and quantity\n16. a way to broadcast an update with a message\n17. a way to focus on one zone\n18. a way to file a situation report\nCover every numbered item."
  }
];

