
import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Power, ExternalLink, X, BriefcaseBusiness } from "lucide-react";

const emptyForm = {
  title: "",
  company: "",
  description: "",
  required_skills: "",
  location: "",
  type: "Internship",
  domain: "",
  apply_url: "",
  deadline: "",
  stipend: "",
  level: "",
  assigned_recruiter_id: "",
};

const styles = {
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #e2e5ef",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#20243a",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "7px",
    color: "#454b65",
  },
  button: {
    border: "1px solid #e1e4ee",
    borderRadius: "9px",
    padding: "10px 13px",
    background: "#fff",
    color: "#333852",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontWeight: 600,
  },
};

export default function Opportunities({ opportunities = [], req, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (Array.isArray(opportunities) ? opportunities : []).filter((item) => {
      const matchesSearch =
        !q ||
        [item.title, item.company, item.location, item.domain,
          ...(Array.isArray(item.required_skills) ? item.required_skills : [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const active = item.is_active !== false;
      const matchesStatus =
        filter === "all" ||
        (filter === "active" && active) ||
        (filter === "inactive" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [opportunities, search, filter]);

  const activeCount = opportunities.filter((item) => item.is_active !== false).length;

 async function openAdd() {
  setEditing(null);
  setForm(emptyForm);
  setError("");
  setModal(true);

  try {
    const result = await req("/api/admin/recruiters");
    const approvedRecruiters = (result.recruiters || []).filter(
      (recruiter) =>
        recruiter.role === "recruiter" &&
        recruiter.recruiter_status === "approved"
    );
    setRecruiters(approvedRecruiters);
  } catch (err) {
    setError(err.message || "Unable to load approved recruiters");
  }
}
  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      company: item.company || "",
      description: item.description || "",
      required_skills: Array.isArray(item.required_skills)
        ? item.required_skills.join(", ")
        : item.required_skills || "",
      location: item.location || "",
      type: item.type || "Internship",
      domain: item.domain || "",
      apply_url: item.apply_url || "",
      deadline: item.deadline ? String(item.deadline).slice(0, 10) : "",
      stipend: item.stipend || "",
      level: item.level || "",
    });
    setError("");
    setModal(true);
  }

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      required_skills: form.required_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };
if (editing) {
  delete payload.assigned_recruiter_id;
}
    try {
      if (editing) {
        await req(`/api/admin/opportunities/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await req("/api/admin/opportunities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModal(false);
      setEditing(null);
      setForm(emptyForm);
      await onRefresh();
    } catch (err) {
      setError(err.message || "Unable to save opportunity");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item) {
    const id = item.id;
    setActionId(id);
    setError("");

    try {
      await req(`/api/admin/opportunities/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: item.is_active === false }),
      });
      await onRefresh();
    } catch (err) {
      setError(err.message || "Unable to update status");
    } finally {
      setActionId("");
    }
  }

  async function remove(item) {
    if (!window.confirm(
      `Delete "${item.title}" by ${item.company}?\n\nIf applications are linked, the backend will prevent deletion.`
    )) return;

    setActionId(item.id);
    setError("");

    try {
      await req(`/api/admin/opportunities/${item.id}`, {
        method: "DELETE",
      });
      await onRefresh();
    } catch (err) {
      setError(err.message || "Unable to delete opportunity");
    } finally {
      setActionId("");
    }
  }

  const field = (name, label, required = false, type = "text") => (
    <div>
      <label style={styles.label}>
        {label}{required ? " *" : ""}
      </label>
      <input
        style={styles.input}
        type={type}
        value={form[name]}
        onChange={(e) => change(name, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <section className="panel" style={{ padding: "22px", overflow: "visible" }}>
      <div className="paneltitle" style={{ alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2>Opportunities management</h2>
          <p>Manage live opportunities and manually added listings.</p>
        </div>
        <button className="refresh" onClick={openAdd}>
          <Plus size={16} /> Add opportunity
        </button>
      </div>

      {error && (
        <div className="error banner" style={{ margin: "14px 0" }}>
          {error}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
        gap: 12,
        margin: "20px 0",
      }}>
        {[
          ["Total opportunities", opportunities.length],
          ["Active", activeCount],
          ["Inactive", opportunities.length - activeCount],
          ["Showing", rows.length],
        ].map(([label, value]) => (
          <div key={label} className="stat" style={{ padding: 16 }}>
            <small>{label}</small>
            <strong style={{ display: "block", fontSize: 25, marginTop: 8 }}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 18,
      }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={17} style={{
            position: "absolute", left: 12, top: 12, color: "#858ba2",
          }} />
          <input
            style={{ ...styles.input, paddingLeft: 38 }}
            placeholder="Search title, company, location, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          style={{ ...styles.input, width: "auto", minWidth: 150 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Location</th>
              <th>Type</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id || item.source_id}>
                <td style={{ minWidth: 220 }}>
                  <b>{item.title || "Untitled"}</b>
                  <div style={{ color: "#777f98", fontSize: 12, marginTop: 4 }}>
                    {item.company || "—"}
                  </div>
                  {item.required_skills?.length > 0 && (
                    <div style={{ color: "#777f98", fontSize: 11, marginTop: 5 }}>
                      {item.required_skills.join(", ")}
                    </div>
                  )}
                </td>
                <td>{item.location || "—"}</td>
                <td>{item.type || "—"}</td>
                <td>
                  <span className="pill">
                    {item.source_type || "unknown"}
                  </span>
                </td>
                <td>
                  <span className={"pill " + (item.is_active === false ? "rejected" : "approved")}>
                    {item.is_active === false ? "Inactive" : "Active"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      style={styles.button}
                      title="Edit"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      style={styles.button}
                      title={item.is_active === false ? "Activate" : "Deactivate"}
                      disabled={actionId === item.id}
                      onClick={() => toggleStatus(item)}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      style={{ ...styles.button, color: "#c43e51" }}
                      title="Delete"
                      disabled={actionId === item.id}
                      onClick={() => remove(item)}
                    >
                      <Trash2 size={15} />
                    </button>
                    {item.apply_url && (
                      <a
                        href={item.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...styles.button, textDecoration: "none" }}
                        title="Open application link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!rows.length && (
          <div className="empty">
            {opportunities.length
              ? "No opportunities match your search."
              : "No opportunities found."}
          </div>
        )}
      </div>

      {modal && (
        <div
          onClick={() => !saving && setModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(17,18,38,.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(760px,100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  {editing ? "Edit opportunity" : "Add opportunity"}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#788099", fontSize: 13 }}>
                  Fields marked * are required.
                </p>
              </div>
              <button style={styles.button} onClick={() => setModal(false)} disabled={saving}>
                <X size={18} />
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <form onSubmit={save}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 15,
              }}>
                {field("title", "Title", true)}
                {field("company", "Company", true)}
                {field("location", "Location", true)}
                <div>
                  <label style={styles.label}>Type *</label>
                  <select
                    style={styles.input}
                    value={form.type}
                    onChange={(e) => change("type", e.target.value)}
                    required
                  >
                    <option>Internship</option>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>
                {field("domain", "Domain")}
                {field("level", "Level")}
                {field("stipend", "Stipend")}
                {field("deadline", "Deadline", false, "date")}
                {field("apply_url", "Application URL")}
                {!editing && (
  <div>
    <label style={styles.label}>Assign to recruiter *</label>
    <select
      style={styles.input}
      value={form.assigned_recruiter_id || ""}
      onChange={(e) =>
        change("assigned_recruiter_id", e.target.value)
      }
      required
    >
      <option value="">Select approved recruiter</option>
      {recruiters.map((recruiter) => (
        <option key={recruiter.id} value={recruiter.id}>
          {recruiter.company || recruiter.name || recruiter.email || recruiter.id}
        </option>
      ))}
    </select>

    {!recruiters.length && (
      <small style={{ color: "#c43e51" }}>
        No approved recruiters found.
      </small>
    )}
  </div>
)}
                <div>
                  <label style={styles.label}>Required skills (comma separated)</label>
                  <input
                    style={styles.input}
                    value={form.required_skills}
                    onChange={(e) => change("required_skills", e.target.value)}
                    placeholder="React, JavaScript, HTML"
                  />
                </div>
              </div>

              <div style={{ marginTop: 15 }}>
                <label style={styles.label}>Description *</label>
                <textarea
                  style={{ ...styles.input, minHeight: 120, resize: "vertical" }}
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
                  required
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 22,
              }}>
                <button
                  type="button"
                  style={styles.button}
                  onClick={() => setModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="refresh" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save changes" : "Create opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}