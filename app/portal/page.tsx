// Just a mock test data before connecting to firbase db
const orders = [
  {
    id: "CS-1001",
    date: "Oct 20, 2026",
    items: "Pine lumber, 2 × 4",
    total: "$1,250.00",
    status: "In Progress",
  },
  {
    id: "CS-1002",
    date: "Oct 18, 2026",
    items: "Cedar boards",
    total: "$860.00",
    status: "Delivered",
  },
  {
    id: "CS-1003",
    date: "Oct 15, 2026",
    items: "Spruce lumber",
    total: "$2,100.00",
    status: "Processing",
  },
];

const statusStyles: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-800",
  Delivered: "bg-green-100 text-green-800",
  Processing: "bg-amber-100 text-amber-800",
};

export default function CustomerDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-sm font-medium text-green-700">
            Customer Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Welcome back, Customer
          </h1>
          <p className="mt-2 text-gray-600">
            View your orders, track deliveries, and review lumber
            weight specifications.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Orders"
            value="12"
            description="All-time orders"
          />
          <SummaryCard
            title="In Progress"
            value="2"
            description="Orders being processed"
          />
          <SummaryCard
            title="Delivered"
            value="10"
            description="Successfully delivered"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your latest lumber orders
              </p>
            </div>

            <a
              href="/portal/orders"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              View all
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {order.date}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {order.items}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-900">
                      {order.total}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyles[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
