    import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import API from "../api/axios";
import { Building2, Users, Settings, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
function OrganizationDetailPage() {
  const { organizationId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [memberForm, setMemberForm] = useState({
    user_id: "",
    role: "analyst",
  });

  const [settingForm, setSettingForm] = useState({
    setting_key: "",
    setting_value: "",
  });

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const fetchOrganization = async () => {
    const res = await API.get(`/organizations/${organizationId}`);
    setData(res.data);
  };

  const addMember = async () => {
    if (!memberForm.user_id) {
      alert("User ID required");
      return;
    }

    await API.post(`/organizations/${organizationId}/members`, {
      user_id: Number(memberForm.user_id),
      role: memberForm.role,
    });

    setMemberForm({
      user_id: "",
      role: "analyst",
    });

    fetchOrganization();
  };

  const addSetting = async () => {
    if (!settingForm.setting_key.trim()) {
      alert("Setting key required");
      return;
    }

    await API.post(`/organizations/${organizationId}/settings`, settingForm);

    setSettingForm({
      setting_key: "",
      setting_value: "",
    });

    fetchOrganization();
  };

  if (!data) {
    return (
      <PageLayout>
        <div className="rounded-3xl bg-white p-10 text-center shadow">
          Loading organization...
        </div>
      </PageLayout>
    );
  }

  const org = data.organization;

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-white/20 p-4">
              <Building2 size={36} />
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
                Organization Workspace
              </p>

              <h1 className="mt-2 text-4xl font-extrabold">
                {org.name}
              </h1>

              <p className="mt-2 text-blue-100">
                {org.description || "No description"}
              </p>

              <p className="mt-2 text-sm text-blue-100">
                Your Role: {data.my_role}
              </p>
            </div>
             <div className="flex gap-3">
              <button
                onClick={() =>
                  navigate(`/organizations/${organizationId}/settings`)
                }
                className="rounded-xl bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
              >
                Organization Settings
              </button>
            </div>

          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Users size={20} />
              <h2 className="text-xl font-bold">Members</h2>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                type="number"
                value={memberForm.user_id}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    user_id: e.target.value,
                  })
                }
                placeholder="User ID"
                className="rounded-xl border px-4 py-3"
              />

              <select
                value={memberForm.role}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    role: e.target.value,
                  })
                }
                className="rounded-xl border px-4 py-3"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                onClick={addMember}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
              >
                <Plus size={18} />
                Add
              </button>
             
            </div>

            <div className="space-y-3">
              {data.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <span>User #{member.user_id}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <Settings size={20} />
              <h2 className="text-xl font-bold">Settings</h2>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={settingForm.setting_key}
                onChange={(e) =>
                  setSettingForm({
                    ...settingForm,
                    setting_key: e.target.value,
                  })
                }
                placeholder="Setting Key"
                className="rounded-xl border px-4 py-3"
              />

              <input
                value={settingForm.setting_value}
                onChange={(e) =>
                  setSettingForm({
                    ...settingForm,
                    setting_value: e.target.value,
                  })
                }
                placeholder="Setting Value"
                className="rounded-xl border px-4 py-3"
              />

              <button
                onClick={addSetting}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {data.settings?.map((setting) => (
                <div
                  key={setting.id}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <p className="font-bold">{setting.setting_key}</p>
                  <p className="text-sm text-slate-500">
                    {setting.setting_value || "No value"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default OrganizationDetailPage;