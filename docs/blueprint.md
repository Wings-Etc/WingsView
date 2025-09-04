# **App Name**: WingsView

## Core Features:

- Data Fetching and Aggregation: Fetch data from multiple API endpoints (store info, performance, sales, inventory, labor, snapshots) and aggregate it to provide company, district, and store-level views. Utilizes React Query for efficient data fetching and caching.
- KPI Calculation: Compute key performance indicators (KPIs) such as Net Sales, Comp Net Sales %, Guest Count, Avg Check, Carryout %, Labor % of Sales, Food Cost %, Alcohol Pour Cost %, Discounts %, and Foundation Donations based on the fetched data.
- Dynamic Chart Generation Tool: Dynamically select data fields for charts based on data relevance. AI will guide non-technical users in choosing metrics that correlate for insightful visualizations. Users simply specify an effect they'd like to understand (e.g. revenue decrease), and the tool suggests related fields like marketing spend or weather patterns for creating correlation-based charts, providing valuable insights.
- Interactive Dashboard: Provide interactive dashboards with drill-down capabilities for company, district, and store views. Includes various visualizations like KPI cards, trend charts, heatmaps, and tables.
- Filtering and Comparison: Implement global filters for timeframe (Today, WTD, MTD, QTD, YTD, Custom), scope (Company, District, Store), and channel (Dine-In/Carryout/To-Go). Allow comparison against last year's data.
- User Authentication and Authorization: Ensure that only users are granted access. No registration is needed for the MVP.
- Mock Data Mode: Implement a mock data mode to run the UI offline with seeded sample data, facilitating development and testing.

## Style Guidelines:

- Primary color: Blue (#2979FF) to convey trust and stability, reflecting a professional environment. Use this color for main interactive elements and headings.
- Background color: Light gray (#F0F2F5) to create a clean and neutral backdrop, ensuring data visualization is the focal point.
- Accent color: Orange (#FF7043) to highlight key metrics and call-to-action buttons, drawing user attention to important data points.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern and neutral appearance. Suitable for both headlines and body text to maintain readability and consistency.
- Use a set of simple, consistent icons from Material UI (MUI) to represent different KPIs and navigation elements. Icons should be monochromatic, using the primary blue color to maintain a cohesive design.
- Use a card-based layout with white cards on a light gray background to organize information clearly. Implement soft shadows and rounded corners for a modern and approachable look. Ensure responsive design for optimal viewing on various devices.
- Incorporate subtle animations, such as fade-in effects when loading data or transitions between views, to enhance user experience. Avoid excessive animations to maintain a professional and efficient interface.