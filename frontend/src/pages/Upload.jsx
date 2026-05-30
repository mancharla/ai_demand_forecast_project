import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

function Upload() {
  const [file, setFile] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [datasetInfo, setDatasetInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);

      const response = await API.get("/datasets/my-datasets");

      setDatasets(response.data);
    } catch (error) {
      console.log(error.response);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    setMessage("");
    setError("");
    setDatasetInfo(null);

    if (!selectedFile) return;

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!["csv", "xlsx"].includes(extension)) {
      setError("Only CSV and Excel files are allowed");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a dataset file");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        "/datasets/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(response.data.message);

      setDatasetInfo({
        dataset_id: response.data.dataset_id,
        file_name: response.data.file_name,
        rows: response.data.rows,
        columns: response.data.columns,
      });

      setFile(null);

      await fetchDatasets();
    } catch (error) {
      console.log(error.response);

      setError(
        error.response?.data?.detail ||
          "Dataset upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteDataset = async (datasetId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this dataset?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/datasets/${datasetId}`);

      setMessage("Dataset deleted successfully");

      await fetchDatasets();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Dataset delete failed"
      );
    }
  };

  return (
    <PageLayout>
      <div className="space-y-8 text-gray-900 dark:text-white">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold">
            Upload Dataset
          </h1>

          <p className="mt-3 text-blue-100">
            Upload CSV or Excel datasets for demand forecasting.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Dataset Upload
            </h2>

            <p className="text-gray-500 dark:text-gray-300 mb-6">
              Required columns:
              <span className="font-semibold text-gray-700">
                {" "}
                Date, Product, Sales
              </span>
              . Optional columns:
              <span className="font-semibold text-gray-700">
                {" "}
                Region, Category
              </span>
              .
            </p>

            <div className="border  dark:border-slate-700 dark:bg-slate-800 dark:text-white-2 border-dashed border-blue-300 rounded-3xl p-10 text-center bg-blue-50 hover:bg-blue-100 transition-all duration-300">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="fileUpload"
              />

              <label
                htmlFor="fileUpload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="text-6xl mb-4">📁</div>

                <h2 className="text-2xl font-bold text-blue-700">
                  Choose Dataset File
                </h2>

                <p className="text-gray-500 dark:text-gray-300 mt-2">
                  CSV or Excel files only
                </p>
              </label>

              {file && (
                <div className="mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl shadow">
                  <p className="font-semibold text-gray-700">
                    Selected File
                  </p>

                  <p className="text-blue-600 mt-1">
                    {file.name}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 bg-red-100 text-red-700 p-4 rounded-xl font-semibold">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 bg-green-100 text-green-700 p-4 rounded-xl font-semibold">
                {message}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className={`mt-8 w-full py-4 rounded-2xl text-white text-lg font-bold shadow-lg transition-all duration-300 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] hover:shadow-2xl"
              }`}
            >
              {loading ? "Uploading Dataset..." : "Upload Dataset"}
            </button>

            {loading && (
              <LoadingSpinner text="Uploading and validating dataset..." />
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Latest Upload Summary
            </h2>

            {!datasetInfo ? (
              <div className="text-gray-500 dark:text-gray-300 bg-gray-50 p-6 rounded-2xl">
                Upload a dataset to view summary details here.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-blue-50 p-5 rounded-2xl">
                    <p className="text-gray-500 dark:text-gray-300">Dataset ID</p>
                    <h3 className="text-3xl font-bold text-blue-600">
                      {datasetInfo.dataset_id}
                    </h3>
                  </div>

                  <div className="bg-green-50 p-5 rounded-2xl">
                    <p className="text-gray-500 dark:text-gray-300">Rows</p>
                    <h3 className="text-3xl font-bold text-green-600">
                      {datasetInfo.rows}
                    </h3>
                  </div>

                  <div className="bg-purple-50 p-5 rounded-2xl">
                    <p className="text-gray-500 dark:text-gray-300">Columns</p>
                    <h3 className="text-3xl font-bold text-purple-600">
                      {datasetInfo.columns.length}
                    </h3>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 dark:text-gray-300 mb-2">
                    File Name
                  </p>

                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {datasetInfo.file_name}
                  </h3>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-3">
                    Columns Detected
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {datasetInfo.columns.map((column, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white dark:text-white mb-6">
            My Uploaded Datasets
          </h2>

          {loadingDatasets ? (
            <LoadingSpinner text="Loading datasets..." />
          ) : datasets.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 p-5 rounded-2xl">
              No datasets uploaded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">File Name</th>
                    <th className="p-3 text-left">Uploaded At</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {datasets.map((dataset) => (
                    <tr
                      key={dataset.id}
                      className="border dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-white-t hover:bg-gray-50"
                    >
                      <td className="p-3">{dataset.id}</td>

                      <td className="p-3">
                        {dataset.file_name}
                      </td>

                      <td className="p-3 text-sm text-gray-500 dark:text-gray-300 dark:text-gray-300">
                        {dataset.uploaded_at || "N/A"}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => deleteDataset(dataset.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default Upload;