import React, { useState } from "react";
import { globalSearch } from "../api/phase3Api";

function GlobalSearch() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {

    if (!query.trim()) {
      return;
    }

    try {

      setLoading(true);

      const response = await globalSearch(query);

      setResults(response.data);

    } catch (error) {

      console.error("Search failed:", error);

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors duration-300">

      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Global Search
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">

        <input
          type="text"
          placeholder="Search users, datasets, forecasts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-4 focus:ring-blue-100"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
        >
          Search
        </button>

      </div>

      {loading && (
        <p className="mt-4 text-gray-500 dark:text-gray-300">
          Searching...
        </p>
      )}

      {results && (
        <div className="mt-6 space-y-8">

          {/* USERS */}

          <SearchSection
            title="Users"
            data={results.users}
            emptyMessage="No users found."
            render={(item) => (
              <>
                <p className="font-bold text-gray-800 dark:text-white">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {item.email}
                </p>

                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold uppercase">
                  {item.role}
                </span>
              </>
            )}
          />

          {/* DATASETS */}

          <SearchSection
            title="Datasets"
            data={results.datasets}
            emptyMessage="No datasets found."
            render={(item) => (
              <>
                <p className="font-bold text-gray-800 dark:text-white">
                  {item.original_filename ||
                    item.file_name}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Dataset ID: {item.id}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-300">
                  User ID: {item.user_id}
                </p>
              </>
            )}
          />

          {/* FORECASTS */}

          <SearchSection
            title="Forecasts"
            data={results.forecasts}
            emptyMessage="No forecasts found."
            render={(item) => (
              <>
                <p className="font-bold text-gray-800 dark:text-white">
                  {item.product ||
                    item.product_name}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Model: {item.model_name}
                </p>

                <p className="text-sm text-green-600 font-semibold">
                  Predicted Sales: ₹{" "}
                  {item.predicted_sales}
                </p>
              </>
            )}
          />

          {/* NOTIFICATIONS */}

          <SearchSection
            title="Notifications"
            data={results.notifications}
            emptyMessage="No notifications found."
            render={(item) => (
              <>
                <p className="font-bold text-gray-800 dark:text-white">
                  {item.title || "Notification"}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {item.message}
                </p>
              </>
            )}
          />

        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  data,
  render,
  emptyMessage,
}) {

  return (
    <div>

      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
        {title}
      </h3>

      {data?.length > 0 ? (

        <div className="space-y-3">

          {data.map((item, index) => (

            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 transition-colors"
            >
              {render(item)}
            </div>

          ))}

        </div>

      ) : (

        <p className="text-gray-500 dark:text-gray-300">
          {emptyMessage}
        </p>

      )}
    </div>
  );
}

export default GlobalSearch;



