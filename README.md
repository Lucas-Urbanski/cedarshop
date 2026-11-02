This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firebase Firestore rules

The app stores user profiles, operational data, and compressed loss-report
photos in Firestore. Before using authentication and workflows, deploy the
Firestore rules to the `cedarshoplms` Firebase project:

```bash
firebase deploy --only firestore:rules --project cedarshoplms
```

Administrators have full read/write access to Firestore. Other
accounts are restricted by the collection-specific rules: customer records
are owner-scoped, inventory costs are administrator-only, and drivers can
update only delivery status. Loss-report photos are resized and compressed in
the browser before being saved directly in their Firestore report document.
Staff roles must be assigned through a trusted Firebase Admin SDK environment,
never from client code.

This app is statically exported, so page guards provide navigation and UI
protection rather than server-side authorization. Firestore rules are the
security boundary for persisted data and must be deployed before using the
workflows.

Existing workspaces use these collections:

- `products`: public catalog names and prices.
- `inventory`: quantities and yard locations, accessible to yard, sales, and
  administrator roles.
- `productCosts`: administrator-only unit costs.
- `orders`, `deliveries`, and `salesQuotes`: customer-owned orders/deliveries
  and staff-authored quotes.
- `yardWorkOrders`, `yardLossReports`, and `yardActivity`: yard operations.
- `system/demoFixturesV1`: one-time demo seed marker.

An administrator can explicitly load clearly marked demonstration inventory,
yard records, and route records from the Admin page. The seeder only runs when
all corresponding collections are empty and never creates orders for another
customer. To seed again, remove the demo documents and the
`system/demoFixturesV1` marker from Firestore.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
