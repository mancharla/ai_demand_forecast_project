import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function Forecast() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");

  const [forecastDays, setForecastDays] = useState(7);
  const [modelType, setModelType] = useState("best");

  const [selectedProduct, setSelectedProduct] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");

  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const [topProduct, setTopProduct] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [citySales, setCitySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [modelComparison, setModelComparison] = useState([]);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState([]);

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#9333ea",
    "#f97316",
    "#dc2626",
    "#14b8a6",
  ];

  useEffect(() => {
    fetchDatasets();
    fetchHistory();
    fetchMetrics();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);

      const response = await API.get("/datasets/my-datasets");

      setDatasets(response.data || []);

      if (response.data?.length > 0) {
        setDatasetId(response.data[0].id);
      }
    } catch (error) {
      console.log(error.response);
      alert("Failed to load datasets");
    } finally {
      setLoadingDatasets(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await API.get("/forecast/history/my-history");
      setHistory(response.data || []);
    } catch (error) {
      console.log(error.response);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await API.get("/forecast/metrics/my-metrics");
      setMetrics(response.data || []);
    } catch (error) {
      console.log(error.response);
    }
  };

  const generateForecast = async () => {
    if (!datasetId) {
      alert("Please select a dataset");
      return;
    }

    try {
      setLoadingForecast(true);

      const response = await API.post(
        `/forecast/${datasetId}?days=${forecastDays}&model_type=${modelType}`
      );

      const productForecasts = (response.data.product_forecasts || []).map(
        (item) => ({
          product: item.product,
          sales: item.predicted_sales,
          model_used: item.model_used || response.data.model_used,
        })
      );

      const cityWiseSales = Object.entries(
        response.data.city_wise_sales || {}
      ).map(([city, sales]) => ({
        city,
        sales,
      }));

      const monthlyData = Object.entries(
        response.data.monthly_sales || {}
      ).map(([month, sales]) => ({
        month,
        sales,
      }));

      const inventoryData = (response.data.inventory_recommendations || []).map(
        (item) => {
          const matchedProduct = productForecasts.find(
            (forecast) => forecast.product === item.product
          );

          return {
            ...item,
            predicted_sales: matchedProduct?.sales || 0,
          };
        }
      );

      setForecastData(productForecasts);
      setCitySales(cityWiseSales);
      setMonthlySales(monthlyData);
      setInventory(inventoryData);
      setTopProduct(response.data.top_demand_product || "N/A");
      setModelComparison(response.data.model_comparison || []);

      setSelectedProduct("All");
      setSelectedRegion("All");

      fetchHistory();
      fetchMetrics();
    } catch (error) {
      console.log(error.response);

      alert(error.response?.data?.detail || "Forecast generation failed");
    } finally {
      setLoadingForecast(false);
    }
  };

  const filteredForecastData = useMemo(() => {
    if (selectedProduct === "All") return forecastData;

    return forecastData.filter((item) => item.product === selectedProduct);
  }, [forecastData, selectedProduct]);

  const filteredCitySales = useMemo(() => {
    if (selectedRegion === "All") return citySales;

    return citySales.filter((item) => item.city === selectedRegion);
  }, [citySales, selectedRegion]);

  const totalPredictedSales = forecastData.reduce(
    (sum, item) => sum + Number(item.sales || 0),
    0
  );

  const averagePredictedSales =
    forecastData.length > 0
      ? (totalPredictedSales / forecastData.length).toFixed(2)
      : 0;

  const highestPredictedSales =
    forecastData.length > 0
      ? Math.max(...forecastData.map((item) => Number(item.sales || 0)))
      : 0;

  const bestModel =
    modelComparison.length > 0
      ? modelComparison.reduce((best, current) =>
          Number(best.mape || 999999) < Number(current.mape || 999999)
            ? best
            : current
        )
      : null;

  const StatCard = ({ title, value, color }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
      <p className="text-gray-500">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    </div>
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Advanced AI Demand Forecast
          </h1>

          <p className="text-gray-500 mb-6">
            Select dataset, forecast duration, and ML model to generate demand
            predictions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="border p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
              disabled={loadingDatasets}
            >
              {datasets.length === 0 ? (
                <option value="">No datasets uploaded</option>
              ) : (
                datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    #{dataset.id} -{" "}
                    {dataset.file_name ||
                      dataset.original_filename ||
                      dataset.filename}
                  </option>
                ))
              )}
            </select>

            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(e.target.value)}
              className="border p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <option value={7}>7 Days</option>
              <option value={15}>15 Days</option>
              <option value={30}>30 Days</option>
            </select>

            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="border p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <option value="best">Best Model</option>
              <option value="linear_regression">Linear Regression</option>
              <option value="random_forest">Random Forest</option>
              <option value="xgboost">XGBoost</option>
            </select>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="border p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
              disabled={forecastData.length === 0}
            >
              <option value="All">All Products</option>
              {forecastData.map((item) => (
                <option key={item.product} value={item.product}>
                  {item.product}
                </option>
              ))}
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
              disabled={citySales.length === 0}
            >
              <option value="All">All Regions</option>
              {citySales.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateForecast}
            disabled={loadingForecast || !datasetId}
            className={`mt-6 px-8 py-4 rounded-xl text-white font-bold shadow-lg transition-all duration-300 ${
              loadingForecast
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-105 hover:shadow-2xl"
            }`}
          >
            {loadingForecast ? "Generating Forecast..." : "Generate Forecast"}
          </button>
        </div>

        {forecastData.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">
              No Forecast Generated Yet
            </h2>
            <p>Select a dataset and model, then click Generate Forecast.</p>
          </div>
        )}

        {forecastData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Forecast Summary</h2>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-5 rounded-2xl">
                <p className="text-gray-500">Top Product</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {topProduct}
                </h3>
              </div>

              <div className="bg-green-50 p-5 rounded-2xl">
                <p className="text-gray-500">Best Model</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {bestModel?.model_name || forecastData[0]?.model_used || "N/A"}
                </h3>
              </div>

              <div className="bg-purple-50 p-5 rounded-2xl">
                <p className="text-gray-500">Accuracy</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {bestModel?.accuracy
                    ? `${Number(bestModel.accuracy).toFixed(2)}%`
                    : "N/A"}
                </h3>
              </div>

              <div className="bg-orange-50 p-5 rounded-2xl">
                <p className="text-gray-500">Forecast Days</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {forecastDays}
                </h3>
              </div>
            </div>
          </div>
        )}

        {forecastData.length > 0 && (
          <div className="grid md:grid-cols-5 gap-6">
            <StatCard
              title="Top Demand Product"
              value={topProduct}
              color="text-blue-600"
            />

            <StatCard
              title="Products Forecasted"
              value={forecastData.length}
              color="text-green-600"
            />

            <StatCard
              title="Average Prediction"
              value={`₹ ${Number(averagePredictedSales).toLocaleString(
                "en-IN"
              )}`}
              color="text-purple-600"
            />

            <StatCard
              title="Highest Prediction"
              value={`₹ ${Number(highestPredictedSales).toLocaleString(
                "en-IN"
              )}`}
              color="text-red-600"
            />

            <StatCard
              title="Total Predicted Sales"
              value={`₹ ${Number(totalPredictedSales).toLocaleString("en-IN")}`}
              color="text-orange-600"
            />
          </div>
        )}

        {forecastData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Product-wise Forecast</h2>

              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                {forecastDays} Days | {modelType}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredForecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {citySales.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Region-wise Sales Distribution
            </h2>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={filteredCitySales}
                  dataKey="sales"
                  nameKey="city"
                  outerRadius={140}
                  label
                >
                  {filteredCitySales.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {monthlySales.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Monthly Sales Trend</h2>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#9333ea"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {forecastData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">Forecasted Products</h2>

            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Predicted Sales</th>
                  <th className="p-3 text-left">Model Used</th>
                </tr>
              </thead>

              <tbody>
                {forecastData.map((item) => (
                  <tr key={item.product} className="border-t hover:bg-gray-50">
                    <td className="p-3">{item.product}</td>

                    <td className="p-3">
                      ₹ {Number(item.sales || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="p-3">{item.model_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modelComparison.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">Model Comparison</h2>

            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">MAE</th>
                  <th className="p-3 text-left">RMSE</th>
                  <th className="p-3 text-left">MAPE (%)</th>
                  <th className="p-3 text-left">Accuracy (%)</th>
                </tr>
              </thead>

              <tbody>
                {modelComparison.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3">{item.model_name || item.model}</td>
                    <td className="p-3">
                      {Number(item.mae || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {Number(item.rmse || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {Number(item.mape || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {Number(item.accuracy || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inventory.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">
              Inventory Recommendations
            </h2>

            <table className="w-full border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left">Product</th>
                  <th className="p-4 text-left">Predicted Sales</th>
                  <th className="p-4 text-left">Recommendation</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.product}</td>

                    <td className="p-4">
                      ₹{" "}
                      {Number(item.predicted_sales || 0).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.recommendation === "Increase Inventory"
                            ? "bg-green-100 text-green-700"
                            : item.recommendation === "Reduce Inventory"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">Forecast History</h2>

            {history.length === 0 ? (
              <p className="text-gray-500">No history available.</p>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Dataset</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">Days</th>
                    <th className="p-3 text-left">Top Product</th>
                    <th className="p-3 text-left">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{item.dataset_id}</td>
                      <td className="p-3">{item.model_name}</td>
                      <td className="p-3">{item.forecast_days}</td>
                      <td className="p-3">{item.top_demand_product}</td>
                      <td className="p-3 text-sm">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-6">
              Stored Accuracy Metrics
            </h2>

            {metrics.length === 0 ? (
              <p className="text-gray-500">No metrics available.</p>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Dataset</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">MAE</th>
                    <th className="p-3 text-left">RMSE</th>
                    <th className="p-3 text-left">MAPE</th>
                    <th className="p-3 text-left">Accuracy</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{item.dataset_id}</td>
                      <td className="p-3">{item.model_name}</td>
                      <td className="p-3">
                        {Number(item.mae || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        {Number(item.rmse || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        {Number(item.mape || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        {Number(item.accuracy || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Forecast;