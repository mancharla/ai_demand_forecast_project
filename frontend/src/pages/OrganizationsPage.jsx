import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import { Building2, Plus, Globe, Briefcase } from "lucide-react";

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    country: "",
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const res = await API.get("/organizations/my-organizations");
    setOrganizations(res.data || []);
  };

  const createOrganization = async () => {
    if (!formData.name.trim()) {
      alert("Organization name required");
      return;
    }

    await API.post("/organizations/create", formData);

    setFormData({
      name: "",
      description: "",
      industry: "",
      country: "",
    });

    fetchOrganizations();
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Enterprise Management
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Organizations
          </h1>

          <p className="mt-3 text-blue-100">
            Manage multiple organizations, users, dashboards, datasets,
            forecasts, and reports with organization-level isolation.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-5 text-xl font-bold">Create Organization</h2>

            <div className="space-y-4">
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Organization Name"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="Industry"
                className="w-full rounded-xl border px-4 py-3"
              />

              <input
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="Country"
                className="w-full rounded-xl border px-4 py-3"
              />

              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description"
                rows="4"
                className="w-full rounded-xl border px-4 py-3"
              />

              <button
                onClick={createOrganization}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Organization
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-5 text-xl font-bold">My Organizations</h2>

            {organizations.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
                No organizations found.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {organizations.map((org) => (
                  <Link
                    key={org.id}
                    to={`/organizations/${org.id}`}
                    className="rounded-2xl border bg-slate-50 p-5 transition hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Building2 size={24} />
                    </div>

                    <h3 className="text-lg font-bold">{org.name}</h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {org.description || "No description"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1">
                        <Briefcase size={13} />
                        {org.industry || "Industry N/A"}
                      </span>

                      <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1">
                        <Globe size={13} />
                        {org.country || "Country N/A"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default OrganizationsPage;