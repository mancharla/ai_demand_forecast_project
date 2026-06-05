import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";

function DatasetVersionsPage() {
  const { projectId } = useParams();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedVersion1, setSelectedVersion1] = useState("");
  const [selectedVersion2, setSelectedVersion2] = useState("");

  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/dataset-versions/project/${projectId}`
      );

      setVersions(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const archiveVersion = async (id) => {
    try {
      await API.put(
        `/dataset-versions/${id}/archive`
      );

      fetchVersions();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteVersion = async (id) => {
    if (!window.confirm("Delete version?")) return;

    try {
      await API.delete(
        `/dataset-versions/${id}`
      );

      fetchVersions();
    } catch (error) {
      console.error(error);
    }
  };

  const compareVersions = async () => {
    try {
      const response = await API.post(
        "/dataset-versions/compare",
        {
          version_id_1: Number(selectedVersion1),
          version_id_2: Number(selectedVersion2),
        }
      );

      setComparison(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-orange-700 via-red-700 to-pink-700 p-8 text-white shadow-xl">

          <h1 className="text-4xl font-bold">
            Dataset Versioning Center
          </h1>

          <p className="mt-2 text-orange-100">
            Track dataset changes, compare versions,
            archive datasets and manage upload history.
          </p>

        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-10 shadow">
            Loading versions...
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow p-6">

              <h2 className="text-xl font-bold mb-4">
                Dataset Versions
              </h2>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="bg-slate-100">

                      <th className="p-3 text-left">
                        Version
                      </th>

                      <th className="p-3 text-left">
                        Rows
                      </th>

                      <th className="p-3 text-left">
                        Columns
                      </th>

                      <th className="p-3 text-left">
                        Size
                      </th>

                      <th className="p-3 text-left">
                        Archived
                      </th>

                      <th className="p-3 text-left">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {versions.map((version) => (
                      <tr
                        key={version.id}
                        className="border-b"
                      >

                        <td className="p-3">
                          V{version.version_number}
                        </td>

                        <td className="p-3">
                          {version.rows_count}
                        </td>

                        <td className="p-3">
                          {version.columns_count}
                        </td>

                        <td className="p-3">
                          {version.file_size_mb} MB
                        </td>

                        <td className="p-3">
                          {version.is_archived
                            ? "Yes"
                            : "No"}
                        </td>

                        <td className="p-3 flex gap-2">

                          {!version.is_archived && (
                            <button
                              onClick={() =>
                                archiveVersion(
                                  version.id
                                )
                              }
                              className="bg-yellow-500 text-white px-3 py-1 rounded"
                            >
                              Archive
                            </button>
                          )}

                          <button
                            onClick={() =>
                              deleteVersion(
                                version.id
                              )
                            }
                            className="bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            <div className="bg-white rounded-3xl shadow p-6">

              <h2 className="text-xl font-bold mb-4">
                Compare Versions
              </h2>

              <div className="grid md:grid-cols-3 gap-4">

                <select
                  value={selectedVersion1}
                  onChange={(e) =>
                    setSelectedVersion1(
                      e.target.value
                    )
                  }
                  className="border rounded-xl p-3"
                >
                  <option value="">
                    Select Version 1
                  </option>

                  {versions.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                    >
                      Version {v.version_number}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedVersion2}
                  onChange={(e) =>
                    setSelectedVersion2(
                      e.target.value
                    )
                  }
                  className="border rounded-xl p-3"
                >
                  <option value="">
                    Select Version 2
                  </option>

                  {versions.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                    >
                      Version {v.version_number}
                    </option>
                  ))}
                </select>

                <button
                  onClick={compareVersions}
                  className="bg-blue-600 text-white rounded-xl"
                >
                  Compare
                </button>

              </div>

              {comparison && (
                <div className="mt-6 grid md:grid-cols-2 gap-4">

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-bold">
                      Version 1
                    </h3>

                    <p>
                      Rows:
                      {
                        comparison.comparison
                          .version_1.rows
                      }
                    </p>

                    <p>
                      Columns:
                      {
                        comparison.comparison
                          .version_1.columns
                      }
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-bold">
                      Version 2
                    </h3>

                    <p>
                      Rows:
                      {
                        comparison.comparison
                          .version_2.rows
                      }
                    </p>

                    <p>
                      Columns:
                      {
                        comparison.comparison
                          .version_2.columns
                      }
                    </p>
                  </div>

                </div>
              )}

            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

export default DatasetVersionsPage;