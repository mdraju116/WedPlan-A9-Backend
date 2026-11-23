# WedPlan Backend

The WedPlan backend is the Express API for the WedPlan wedding-services marketplace. It serves the frontend with service listings, bookings, role-based dashboards, user management, and Stripe subscription operations.

**Frontend:** [WedPlan-A9-Frontend](https://github.com/mdraju116/WedPlan-A9-Frontend)  
**Backend:** [WedPlan-A9-Backend](https://github.com/mdraju116/WedPlan-A9-Backend)  
**Live API:** [wed-plan-a9-backend.vercel.app](https://wed-plan-a9-backend.vercel.app/)

## Features

- Public service listing and detail endpoints, plus vendor service management and admin moderation.
- Customer booking requests, vendor responses, and admin booking management.
- Customer, vendor, and admin dashboard data.
- Better Auth JWT verification and role-based authorization for protected routes.
- Stripe subscription confirmation, refresh, read-only billing portal, transaction listing, and webhook handling.
- MongoDB access shared across local server and serverless requests.
- CORS configured for the local and deployed frontend origins.

## Technology

- **Runtime and API:** Node.js, Express 5, TypeScript
- **Database:** MongoDB Node.js driver
- **Authentication:** Better Auth JWT verification with role authorization
- **Payments:** Stripe

## Project structure

```text
WedPlan-A9-Backend/
├── src/
│   ├── app.ts                      Express app, CORS, database middleware, and route mounting
│   ├── server.ts                   Local server startup
│   ├── config/
│   │   ├── db.ts                   MongoDB client and shared database connection
│   │   └── stripe.ts               Stripe client configuration
│   ├── middlewares/
│   │   ├── authenticate.ts         JWT verification
│   │   ├── authorize.ts            Role checks
│   │   ├── errorHandler.ts         Central API error responses
│   │   └── notFound.ts             Unknown-route handling
│   ├── modules/
│   │   ├── booking/                Booking routes, controllers, and data operations
│   │   ├── dashboard/              Role-specific dashboard endpoints
│   │   ├── payment/                Stripe subscriptions, portal, transactions, and webhook
│   │   ├── service/                Service listings and moderation
│   │   └── user/                   User profiles and administration
│   └── types/
│       └── express.d.ts            Express request type extensions
├── .env.example                    Environment variable template
├── package.json                    Scripts and dependencies
├── package-lock.json               Locked dependency versions
├── tsconfig.json                   TypeScript compiler configuration
└── README.md
```

Each business module groups its routes, controllers, and service/database logic. The frontend and backend are separate repositories and are deployed as separate services; configure the frontend API base URL to point to the deployed backend.


## Local setup

### Requirements

- Node.js 20 or later and npm
- MongoDB Atlas or a local MongoDB deployment
- Stripe credentials for subscription and webhook flows

Clone the repository and install dependencies:

```bash
git clone https://github.com/mdraju116/WedPlan-A9-Backend.git
cd WedPlan-A9-Backend
npm install
```

Create a local environment file from the example. In PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the values in `.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | Local API port; defaults to `5000` |
| `FRONTEND_URL_LOCAL` | Local frontend origin allowed by CORS |
| `FRONTEND_URL_VERCEL` | Deployed frontend origin allowed by CORS and used for Stripe return URLs |
| `MONGODB_URI` | MongoDB connection string |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

Never commit `.env` or real credentials. The frontend also needs its own environment file; see the frontend README for its variables and setup.

Start the API in development:

```bash
npm run dev
```

The local server defaults to `http://localhost:5000`. The root endpoint (`GET /`) returns a server welcome message. The frontend normally runs at `http://localhost:3000`; set `FRONTEND_URL_LOCAL` to that origin.

## API overview

Protected endpoints require a Better Auth JWT in the `Authorization: Bearer <token>` header. Role-specific routes enforce `Customer`, `Vendor`, or `Admin` authorization.

| Route prefix | Purpose |
| --- | --- |
| `/api/users` | User profile operations and admin user management |
| `/api/services` | Public service browsing, vendor listings, and admin moderation |
| `/api/bookings` | Customer bookings, vendor requests, and admin booking management |
| `/api/dashboard` | Customer, vendor, and admin dashboard summaries |
| `/api/payments` | Subscription confirmation and refresh, billing portal, transactions, and Stripe webhook |

The Stripe webhook endpoint is `POST /api/payments/webhook`. For local webhook development, run Stripe CLI and forward events to the local server:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Use the signing secret printed by Stripe CLI as `STRIPE_WEBHOOK_SECRET` in the local environment.

## Commands

Run from the backend repository:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the TypeScript server with file watching |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run start` | Run the compiled server |

